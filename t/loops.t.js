require('proof')(2, prove)

function prove (assert) {
    var cadence = require('..')

    cadence(function (async) {
        async.forEach([ [ 1, 2, 3, 4 ], 0 ], function (value, index, previous) {
            return value + previous
        })
    })(function (error, sum) {
        if (error) throw error
        assert(sum, 10, 'reduce')
    })

    cadence(function (async) {
        async.map([[ 1, 2, 3, 4 ]], function (value, index) {
            return value + index
        })
    })(function (error, map) {
        if (error) throw error
        assert(map, [ 1, 3, 5, 7 ], 'map')
    })
}
