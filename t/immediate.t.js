require('proof/redux')(2, prove)

function prove (assert, callback) {
    var cadence = require('..')

    var f = cadence(function (async) {
        async(function () {
            setImmediate(async())
        }, function () {
            assert(true, 'completed')
            callback()
        })
        async(function () {
            setImmediate(async())
            throw new Error('thrown')
        })
    })

    f(function (error) {
        assert(error.message, 'thrown')
    })
}
