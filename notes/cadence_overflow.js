var cadence = require('..')
var fs = require('fs')

var start = process.hrtime()

var get = cadence(function (async, times) {
    var got, count = 0
    var loop = async(function () {
        if (got) {
            return [ got ]
        } else {
            fs.readFile(__filename, 'utf8', async())
        }
    }, function (result) {
        got = result
        if (++count == times) {
            return [ loop.break ]
        }
    })() // <- overhead is next to nothing, trampoline
})

get(1000000, function (error) {
    if (error) throw error // <- if I got there things got bad
    console.log(process.hrtime(start))
})
