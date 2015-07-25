require('superstack')

Error.stackTraceLimit = Infinity

var cadence = require('..')

var f = cadence(function (async) {
    async(function () {
        setImmediate(async())
    }, function () {
        setTimeout(async(), 0)
    }, function () {
        throw new Error('explode')
    })
})

f(function (error) {
    console.log(error.stack)
})
