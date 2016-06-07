require('proof')(2, prove)

function prove (assert) {
    var cadence = require('..')

    var f = cadence(function (async) {
        async(function () {
            item(1, async())
        }, function (number) {
            assert(number, 1, 'step')
            return 1
        })
    })

    f(function (error, result) {
        if (error) throw error
        assert(result, 1, 'returned')
    })
}

function item (number, callback) { callback(null, number) }
