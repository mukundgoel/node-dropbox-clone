// This script will output "Client's question: Hello, world?" and "Server's answer: 42" in alternating order
// every second until the script is stopped.

let jot = require('json-over-tcp')
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

// argv imports for help
let argv = require('yargs')
  .help('h')
  .alias('h', 'help')
  .describe('dir', 'Root directory to store files')
  .usage('Usage: bode $0 <command> [options]')
  .example('bode $0 --dir /app/dropbox')
  .epilog('Thanks to CodePath and @WalmartLabs for Node.JS!')
  .argv

let SERVER_CONNECTION_PORT = 8099
let ROOT_DIR = argv.dir || path.resolve(process.cwd())

// Creates one connection to the server when the server starts listening
function createConnection() {
  // Start a connection to the server
  let socket = jot.connect(SERVER_CONNECTION_PORT, function() {
    // Send the initial message once connected
    socket.write({
      question: "Send me ye directory"
    })
  })

  // Whenever the server sends us an object...
  socket.on('data', async(data) => {
    // Output the answer property of the server's message to the console
    if (data.type === 'dir') {
      if (data.action === "create") {
        await fs.mkdir(ROOT_DIR + data.path)
        console.log("Created directory " + data.path)
      }
      else if (data.type === "delete") {
        console.log("Deleted directory " + ROOT_DIR + data.path)
        await rimraf.promise(ROOT_DIR + data.path)
      }
	} else {
      if (data.action === "create") {
        console.log("Created file " + ROOT_DIR + data.path)
        let buffer = new Buffer(data.contents, 'base64')
        await mkdirp.promise(path.dirname(path.join(ROOT_DIR, data.path)))
        await fs.writeFile(ROOT_DIR + data.path, buffer)
      }
      else if (data.action === "delete") {
        console.log("Deleted file " + ROOT_DIR + data.path)
        await fs.promise.unlink(ROOT_DIR + data.path)
      }
      else if (data.action === "update") {
        console.log("Updated file " + ROOT_DIR + data.path)
        let buffer = new Buffer(data.contents, 'base64')
        await fs.promise.truncate(ROOT_DIR + data.path, 0)
        await fs.writeFile(ROOT_DIR + data.path, buffer)
      }
	}
  })
}

createConnection()
