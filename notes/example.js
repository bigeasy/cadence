var cadence = require('..')
var fs = require('fs')

cadence(function (async) {
    async(function () {
        fs.readFile(__filename, async())
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
