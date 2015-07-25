var cadence = require('..')
var fs = require('fs')

var got

var start = process.hrtime()

var get = cadence(body)

function body (smedly, times) {
    var got, count = 0
    var loop = smedly(function () {
        if (got) {
            return got
        } else {
            fs.readFile(__filename, 'utf8', smedly())
        }
    }, function (result) {
        got = result
        if (++count == times) {
            return [ loop ]
        }
    })() // <- overhead is next to nothing, trampoline
}

get(1000000, function (error) {
    if (error) throw error // <- if I got there things got bad
    console.log(process.hrtime(start))
})
