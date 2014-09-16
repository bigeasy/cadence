#!/usr/bin/env node

require('proof')(10, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {

        step(function () { return 1 })
        step(function () { return 2 })

    })(function (error, one, two) {

        assert(one, 1, 'step')
        assert(two, 2, 'two step')

    })

    cadence(function (step) {

        step(function () {
            step(function () {
                step()(new Error('errored'))
            })
        }, function () {
            throw new Error('should not be called')
        })

    })(function (error) {

        assert(error.message, 'errored', 'error')

    })

    cadence(function (step) {

        if (!step) throw new Error

        step([function () {
            step(function () {
                step()(new Error('errored'))
            })
        }, function (_, error) {
            assert(error.message, 'errored', 'error caught')
        }])

    })(step())

    cadence(function (step) {

        [ 1, 2, 3 ].forEach(step([], function (number) {
            item(number, step())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        assert(items, [ -1, -2, -3 ], 'step arrayed')

    })(step())

    cadence(function (step) {

        [ 1, 2 ].forEach(step([], function (number) {
            step()(null, number)
            step()(null, number + 1)
        }))

    }, function (first, second) {

        assert(first, [ 1, 2 ], 'arrayed multi return one')
        assert(second, [ 2, 3 ], 'arrayed multi return two')

    })(step())

    cadence(function (step) {

        [].forEach(step([], function (number) {
            item(number, step())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        assert(items, [], 'step arrayed empty')

    })(step())

    cadence(function (step) {

        [ 1, 2, 3 ].forEach(step([], function (number) {
            if (number % 2) step()(null, number)
            else step()(null)
        }))

    }, function (items) {

        assert(items, [ 1, 3 ], 'step arrayed missing')

    })(step())

    cadence(function (step) {

        [ 1 ].forEach(step([], function (number) {
            step(function () {}, function () { return number })
        }))

    }, function (items) {

        assert(items, [ 1 ], 'step arrayed single')

    })(step())

})

function item (value, callback) {
    process.nextTick(function () { callback(null, value) })
}

