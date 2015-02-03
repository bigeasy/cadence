require('proof')(1, prove)

function prove (assert, callback) {
    var cadence = require('../../redux')
    cadence(function (async) {
        async(function () {
            setImmediate(async(), null, 1)
        })
    })(function (error, number) {
        if (error) throw error
        assert(number, 1, 'async')
        callback()
    })
}
