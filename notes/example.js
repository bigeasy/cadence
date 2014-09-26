var cadence = require('cadence')
var fs = require('fs')

cadence(function (step) {
    step(function () {
        fs.readFile(__filename, step())
    }, function () {
        var d = require('domain').create()
        d.on('error', function (error) {
            console.log('captured')
            throw error
        })
        d.run(function () {
            throw new Error
        })
    })
})(function (error) {
    console.log('called')
    if (error) throw error
})
