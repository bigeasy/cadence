var cadence = require('../cadence')
var fs = require('fs')

var f = cadence(function (async) {
    setTimeout(function () {
        async(function () {
            fs.readFile(__filename, 'utf8', async())
        }, function (body) {
            console.log(body)
        })
    }, 1000)
})

f(function (error) { if (error) throw error })
