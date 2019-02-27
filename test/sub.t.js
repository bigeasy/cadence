require('proof')(2, prove)

function prove (okay) {
    var cadence = require('..')

    var f = cadence(function (async) {
        async(function () {
            item(1, async())
        }, function (number) {
            okay(number, 1, 'step')
            return 1
        })
    })

    f(function (error, result) {
        if (error) throw error
        okay(result, 1, 'returned')
    })
}

function item (number, callback) { callback(null, number) }
