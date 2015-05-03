let net = require('net'),
    JsonSocket = require('json-socket')

let port = 9838
let server = net.createServer()
server.listen(port)
server.on('connection', function(socket) {
    socket = new JsonSocket(socket)
    let n
    let isRunning = false
    let streamInterval
    socket.on('message', function(message) {
        if (message.command === 'start') {
            if (!isRunning) {
                n = message.beginAt || 1
                isRunning = true
                streamInterval = setInterval(function() {
                    socket.sendMessage(n * n)
                    n++
                }, 1000)
            }
        } else if (message.command === 'stop') {
            if (isRunning) {
                isRunning = false
                clearInterval(streamInterval)
            }
        }
    })
})
