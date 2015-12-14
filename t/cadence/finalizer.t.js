require('proof')(6, prove)

function prove (assert) {
    var cadence = require('../..')

    var count = 0, object = []
    cadence(function (async) {
        async([function () {
            assert(object === this, 'this')
            assert(count, 1, 'incremented')
        }], function () {
            count++
        })
    }).call(object, function (error) {
        if (error) throw error
    })

    var cleanup = 0
    cadence(function (async) {
        async([function () {
            cleanup++
            throw new Error('one')
        }], [function () {
            cleanup++
            throw new Error('two')
        }], function () {
            return 1
        })
    })(function (error) {
        assert(error.message, 'one', 'first finalizer error')
        assert(cleanup, 2, 'both finalizers called')
    })

    var cleanup = 0
    cadence(function (async) {
        async(function () {
            return 1
        }, [function (one) {
            assert(one, 1, 'finalizer at end called')
        }])
    })(function (error, one) {
        assert(one, 1, 'finalizer at end finished')
    })
}
