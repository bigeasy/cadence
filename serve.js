var spawn = require('child_process').spawn
var http = require('http')
var serve = require('serve-static')('.', { 'index': [ 'index.html' ] })
var finalhandler = require('finalhandler')

var server = http.createServer(function (req, res) {
    var done = finalhandler(req, res)
    var make = spawn('make', [], { customFds: [ 0, 1, 2 ] })
    make.on('exit', function () { serve(req, res, done) })
})

server.listen(3000)
