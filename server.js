
// This is for the server side portion of the Dropbox server
// server will listen to a port for client requests
// for each present in a directory send the contents back to the caller using the JSON API

// imports for the regular HTTP Express project
let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

// imports for the TCP Sync section
let jot = require('json-over-tcp')
let _ = require('lodash')

let TCP_LISTENING_PORT = 8099
let server = jot.createServer(TCP_LISTENING_PORT)
server.on('connection', newConnectionHandler)

let CLIENT_SOCKET

// Start listening
console.log(`TCP sync server listening at 127.0.0.1:${TCP_LISTENING_PORT}`)
server.listen(TCP_LISTENING_PORT)

// argv imports for help
let argv = require('yargs')
  .help('h')
  .alias('h', 'help')
  .describe('dir', 'Root directory to store files')
  .usage('Usage: bode $0 <command> [options]')
  .example('bode $0 --dir /app/dropbox')
  .epilog('Thanks to CodePath and @WalmartLabs for Node.JS!')
  .argv

// Promise API
require('songbird')

const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir || path.resolve(process.cwd())

let app = express()

// run through Morgan middleware first BEFORE app.get call
// move this below app.get if you want it to run AFTER app.get call
console.log("Node Environment set to: " + NODE_ENV)
if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// note here need to use ` instead of " if we want to use {PORT}
app.listen(PORT, ()=> console.log(`HTTP server listening at http://127.0.0.1:${PORT}`))

app.get('*', setFileMeta, sendHeaders, (req, res) => {
	// we need to check if it is a directory but we did that in setHeaders call already and have set the body
	// so we can just reuse that body and return it back to the caller
	if (res.body) {
		res.json(res.body)
		return
	}

	fs.createReadStream(req.filePath).pipe(res)
})

// since we have set the headers we have nothing else to do on the HEAD call
app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())

// here we do not use nodeify since we want to call next only if there is an error
app.delete('*', setFileMeta, (req, res, next) => {
	async()=> {
		if (!req.stat) return res.send(400, 'Invalid Path')

		if (req.stat.isDirectory()) {
			await rimraf.promise(req.filePath)
			if (CLIENT_SOCKET)
			{
				await CLIENT_SOCKET.write({
					"action": "delete",
					"path": req.url,
					"type": "dir",
					"contents": null,
					"updated": null
				})
			}
		} else {
			await fs.promise.unlink(req.filePath)
			if (CLIENT_SOCKET)
			{
				await CLIENT_SOCKET.write({
					"action": "delete",
					"path": req.url,
					"type": "file",
					"contents": null,
					"updated": null
				})
			}
		}
		res.end()
	}().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if (req.stat) return res.send(405, 'File exists')
		await mkdirp.promise(req.dirPath)
		if (!req.isDir) {
			req.pipe(fs.createWriteStream(req.filePath))
			if (CLIENT_SOCKET)
			{
				let buffer = await fs.promise.readFile(req.filePath)
				await CLIENT_SOCKET.write({
					"action": "create",
					"path": req.url,
					"type": "file",
					"contents": buffer.toString("base64"),
					"updated": null
				})
			}
		}
		res.end()
	}().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if (!req.stat) return res.send(405, 'File does not exist')
		if (req.isDir) return res.send(405, 'Path is a directory')

		await fs.promise.truncate(req.filePath, 0)
		req.pipe(fs.createWriteStream(req.filePath))

		if (CLIENT_SOCKET)
		{
			let buffer = await fs.promise.readFile(req.filePath)
			await CLIENT_SOCKET.write({
				"action": "update",
				"path": req.url,
				"type": "file",
				"contents": buffer.toString("base64"),
				"updated": null
			})
		}
		res.end()
	}().catch(next)
})

// Middleware logic is below

function setDirDetails(req, res, next) {
	let filePath = req.filePath
	let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
	let hasExt = path.extname(filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filePath : path.dirname(filePath)
	next()
}

function setFileMeta(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))

	if (req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, ()=> req.stat = null) // catch no file or folder error
		.nodeify(next)
}

function sendHeaders(req, res, next) {

	// we are not using .catch() because we wanted to call next whether it succeed or failed
	nodeify(async() => {
		// stat by itself is a core callback (and they expect callbacks, which we don't want to use)
		// so we will use a promise instead and we will get a promise back

		if (req.stat && req.stat.isDirectory()) {
			let files = await fs.promise.readdir(req.filePath)

			// auto return the json file and all the corresponding headers
			// JSON is an expensive operation in Node, so we want to do it only once
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', JSON.stringify(res.body.length))
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', JSON.stringify(req.stat.size))

		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-Type', contentType)

	}(), next)
}

async function ls(dirPath, socket) {
  let files = await fs.promise.readdir(dirPath)
  let newFile = []
  let promises = []
  for (let file of files) {
    let stat = await fs.promise.stat(dirPath + "/" + file)

	let filePathFromRoot = dirPath + "/" + file
		filePathFromRoot = filePathFromRoot.split(ROOT_DIR, 2)
		filePathFromRoot = filePathFromRoot[1]

    if (stat.isFile()) {
		let buffer = await fs.promise.readFile(dirPath + "/" + file)
		await socket.write({
			"action": "create",
			"path": filePathFromRoot,
			"type": "file",
			"contents": buffer.toString("base64"),
			"updated": stat.mtime
			})
    } else {
		await socket.write({
			"action": "create",
			"path": filePathFromRoot,
			"type": "dir",
			"contents": null,
			"updated": stat.mtime
			})
      await promises.push(ls(dirPath + "/" + file, socket))
    }
  }

  let results = await Promise.all(promises)
  return _.flatten(newFile.concat(results), true)
}

// Triggered whenever something connects to the server
async function newConnectionHandler(socket) {
	CLIENT_SOCKET = socket

  // Whenever a connection sends us an object...
  socket.on('data', function(data) {
    // Output the question property of the client's message to the console
    console.log("Client's question: " + data.question)
    console.log("__dirname is set to: " + path.join(__dirname))
	ls(ROOT_DIR, socket).then(() =>
		console.log("Sent requested files to caller....")
	).catch(e => console.log(e.stack))
  })
}
