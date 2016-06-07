require('proof')(2, prove)

function prove (assert) {
    var cadence = require('..')

    var f = cadence(function (async) {

        item(1, async())

    }, function (number) {

        assert(number, 1, 'step')

    })

    f(function (error) {
        if (error) throw error
    })

    cadence(function () {
        return []
    })(function () {
        assert(arguments.length, 0, 'zero arity does not prepend error')
    })
}

function item (number, callback) { callback(null, number) }
