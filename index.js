let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')

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

app.get('*', (req, res, next) => {
	async() => {
		let filePath = path.resolve(path.join(ROOT_DIR, req.url))
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
			res.json(files)

			return
		}

		fs.createReadStream(filePath).pipe(res)
	}().catch(next)
})
