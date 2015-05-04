// This script will output "Client's question: Hello, world?" and "Server's answer: 42" in alternating order
// every second until the script is stopped.

let jot = require('json-over-tcp')
let SERVER_CONNECTION_PORT = 8099

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
  socket.on('data', function(data) {
    // Output the answer property of the server's message to the console
    if (data.type === 'dir') {
		console.log("Directory sent: " + data.path + " with date of " + data.updated)
	} else {
		console.log("File sent: " + data.path + " with date of " + data.updated + "\n" + data.contents)
	}
  })
}

createConnection()
