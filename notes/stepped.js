var cadence = require('cadence')
var fs = require('fs')

cadence(function (step) {
    step(function () {
        fs.readFile(__filename, step())
    }, function () {
        require('domain').create().on('error', step(Error)).run(function () {
            throw new Error
        })
        /*require('domain').create().run(function () {
            throw new Error
        }).on('error', step(Error))*/
    })
})(function (error) {
    console.log('called')
    if (error) throw error
})
