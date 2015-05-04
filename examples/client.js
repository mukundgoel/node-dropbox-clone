// This script will output "Client's question: Hello, world?" and "Server's answer: 42" in alternating order
// every second until the script is stopped.

let jot = require('json-over-tcp')
let someRandomPort = 8099
let server = jot.createServer(someRandomPort)
server.on('listening', createConnection)

// Creates one connection to the server when the server starts listening
function createConnection() {
  // Start a connection to the server
  let socket = jot.connect(someRandomPort, function() {
    // Send the initial message once connected
    socket.write({
      question: "Hello, world?"
    })
  })

  // Whenever the server sends us an object...
  socket.on('data', function(data) {
    // Output the answer property of the server's message to the console
    console.log("Server's answer: " + data.updated)

    // Wait one second, then write a question to the socket
    setTimeout(function() {
      // Notice that we "write" a JSON object to the socket
      socket.write({
        question: "Hello, world?"
      })
    }, 1000)
  })
}

createConnection()