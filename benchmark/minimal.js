var minimal = require('../minimal')
var ok = require('assert').ok

function inc (count, callback) {
    callback(null, count + 1)
}

var COUNT = 256 * 100

var mloop = minimal(function (async) {
    var loop = async(function (inced) {
        if (inced == COUNT) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

mloop(function (error, count) {
    if (error) throw error
    ok(count == COUNT, 'cadence recurse ok')
    console.log(count)
    mloop(function (error, count) {
        if (error) throw error
        ok(count == COUNT, 'cadence recurse ok')
    })
})
