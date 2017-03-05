require('proof/redux')(4, prove)

function prove (assert) {
    var cadence = require('..')

    cadence(function (async) {
        async(function (value, index, previous) {
            return value + previous
        })([ 1, 2, 3, 4 ], 0)
    })(function (error, sum) {
        if (error) throw error
        assert(sum, 10, 'reduce')
    })

    cadence(function (async) {
        async(function (value, index) {
            return value + index
        })([ 1, 2, 3, 4 ], [])
    })(function (error, map) {
        if (error) throw error
        assert(map, [ 1, 3, 5, 7 ], 'map')
    })

    cadence(function (async) {
        try {
            async.forEach()
        } catch (error) {
            assert(error.message, 'defunct', 'explicit forEach')
        }
    })(function (error, map) {
        if (error) throw error
    })

    cadence(function (async) {
        try {
            async.map()
        } catch (error) {
            assert(error.message, 'defunct', 'explicit map')
        }
    })(function (error, map) {
        if (error) throw error
    })
}
