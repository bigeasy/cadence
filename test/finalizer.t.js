require('proof')(8, prove)

function prove (okay) {
    var cadence = require('..')

    var count = 0, object = []
    cadence(function (async) {
        async([function () {
            okay(object === this, 'this')
            okay(count, 1, 'incremented')
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
        okay(error.message, 'two', 'second finalizer error')
        okay(cleanup, 2, 'both finalizers called')
    })

    var cleanup = 0
    cadence(function (async) {
        async([function () {
            cleanup++
        }], function () {
            throw new Error('body')
        })
    })(function (error) {
        okay(error.message, 'body', 'body error perpetuated')
        okay(cleanup, 1, 'on error finalizer called')
    })

    var cleanup = 0
    cadence(function (async) {
        async(function () {
            return 1
        }, [function (one) {
            okay(one, 1, 'finalizer at end called')
        }])
    })(function (error, one) {
        okay(one, 1, 'finalizer at end finished')
    })
}
