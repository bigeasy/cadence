require('proof')(2, prove)

function prove (assert, callback) {
    var cadence = require('..')
    cadence(function (async) {
        async(function () {
            setImmediate(async(), null, 1)
        }, function (one) {
            assert(one, 1, 'async')
            async()(null, 2)
            async()(null, 3)
        })
    })(function (error, two, three) {
        if (error) throw error
            assert([ two, three ], [ 2, 3 ], 'reset')
        callback()
    })
}
