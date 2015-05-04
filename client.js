// This script will output "Client's question: Hello, world?" and "Server's answer: 42" in alternating order
// every second until the script is stopped.

let jot = require('json-over-tcp')
let fs = require('fs')

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
let ROOT_DIR = argv.dir || "/app/testing"

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
	} else {
		if (data.action === "create") {
			let buffer = await new Buffer(data.contents, 'base64')
			await fs.writeFile(ROOT_DIR + data.path, buffer)
			console.log("Created file " + data.path)
		}
	}
  })
}

createConnection()
