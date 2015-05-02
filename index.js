let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()

// run through Morgan middleware first BEFORE app.get call
// move this below app.get if you want it to run AFTER app.get call
if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// note here need to use ` instead of " if we want to use {PORT}
app.listen(PORT, ()=> console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

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

function setFileMeta(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	if (filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
	fs.promise.stat(filePath)
		.then(stat => req.stat = stat)
		.nodeify(next)
}

function sendHeaders(req, res, next) {

	// we are not using .catch() because we wanted to call next whether it succeed or failed
	nodeify(async() => {
		// stat by itself is a core callback (and they expect callbacks, which we don't want to use)
		// so we will use a promise instead and we will get a promise back
		if (req.stat.isDirectory()) {
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

// here we do not use nodeify since we want to call next only if there is an error
app.delete('*', setFileMeta, (req, res, next) => {
	async()=> {
		if (req.stat.isDirectory())
	}().catch(next)
})
