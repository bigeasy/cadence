require('proof')(8, prove)

function prove (assert) {
    var cadence = require('..')

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
        assert(error.message, 'two', 'second finalizer error')
        assert(cleanup, 2, 'both finalizers called')
    })

    var cleanup = 0
    cadence(function (async) {
        async([function () {
            cleanup++
        }], function () {
            throw new Error('body')
        })
    })(function (error) {
        assert(error.message, 'body', 'body error perpetuated')
        assert(cleanup, 1, 'on error finalizer called')
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
