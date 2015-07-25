var cadence = require('..')
var fs = require('fs')

cadence(function (async) {
    async(function () {
        fs.readFile(__filename, async())
    }, function () {
        require('domain').create().on('error', async(Error)).run(function () {
            throw new Error
        })
        /*require('domain').create().run(function () {
            throw new Error
        }).on('error', async(Error))*/
    })
})(function (error) {
    console.log('called')
    if (error) throw error
})
