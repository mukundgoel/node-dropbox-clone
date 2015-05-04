
let jot = require('json-over-tcp')
let someRandomPort = 8099
let server = jot.createServer(someRandomPort)
server.on('connection', newConnectionHandler)

// Triggered whenever something connects to the server
function newConnectionHandler(socket) {
  // Whenever a connection sends us an object...
  socket.on('data', function(data) {
    // Output the question property of the client's message to the console
    console.log("Client's question: " + data.question)

    // Wait one second, then write an answer to the client's socket
    setTimeout(function() {
      socket.write({
        "action": "create",                        // "update" or "delete"
        "path": "/path/to/file/from/root",
        "type": "dir",                            // or "file"
        "contents": null,                            // or the base64 encoded file contents
        "updated": 1427851834642                    // time of creation/deletion/update
    })
    }, 1000)
  })
}

// Start listening
console.log("Listening at 127.0.0.1:"+someRandomPort)
server.listen(someRandomPort)
