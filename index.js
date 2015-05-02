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

app.get('*', sendHeaders, (req, res) => {
	// we need to check if it is a directory but we did that in setHeaders call already and have set the body
	// so we can just reuse that body and return it back to the caller
	if (res.body) {
		res.json(res.body)
		return
	}

	fs.createReadStream(req.filePath).pipe(res)
})

// since we have set the headers we have nothing else to do on the HEAD call
app.head('*', sendHeaders, (req, res) => res.end())

function sendHeaders(req, res, next) {
	nodeify(async() => {
		let filePath = path.resolve(path.join(ROOT_DIR, req.url))
		req.filePath = filePath
		if (filePath.indexOf(ROOT_DIR) !== 0) {
			res.send(400, 'Invalid path')
			return
		}

		// stat by itself is a core callback (and they expect callbacks, which we don't want to use)
		// so we will use a promise instead and we will get a promise back
		let stat = await fs.promise.stat(filePath)
		if (stat.isDirectory()) {
			let files = await fs.promise.readdir(filePath)

			// auto return the json file and all the corresponding headers
			// JSON is an expensive operation in Node, so we want to do it only once
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', JSON.stringify(res.body.length))
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', JSON.stringify(stat.size))

		let contentType = mime.contentType(path.extname(filePath))
		res.setHeader('Content-Type', contentType)

	}(), next)
}
