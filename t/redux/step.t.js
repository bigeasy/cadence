require('proof')(1, prove)

function prove (assert) {
    var cadence = require('../../redux')

    var f = cadence(function (async) {

        item(1, async())

    }, function (number) {

        assert(number, 1, 'step')

    })

    f(function (error) {
        if (error) throw error
    })
}

function item (number, callback) { callback(null, number) }
