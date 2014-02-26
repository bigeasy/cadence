#!/usr/bin/env node

require('proof')(10, function (step, deepEqual) {
    var cadence = require('../..')

    cadence(function (step) {

        step(function () { return 1 })
        step(function () { return 2 })

    })(function (error, one, two) {

        deepEqual(one, 1, 'step')
        deepEqual(two, 2, 'two step')

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

        deepEqual(error.message, 'errored', 'error')

    })

    cadence(function (step) {

        if (!step) throw new Error

        step([function () {
            step(function () {
                step()(new Error('errored'))
            })
        }, function (_, error) {
            deepEqual(error.message, 'errored', 'error caught')
        }])

    })(step())

    cadence(function (step) {

        [ 1, 2, 3 ].forEach(step([], function (number) {
            item(number, step())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        deepEqual(items, [ -1, -2, -3 ], 'step arrayed')

    })(step())

    cadence(function (step) {

        [ 1, 2 ].forEach(step([], function (number) {
            step()(null, number)
            step()(null, number + 1)
        }))

    }, function (first, second) {

        deepEqual(first, [ 1, 2 ], 'arrayed multi return one')
        deepEqual(second, [ 2, 3 ], 'arrayed multi return two')

    })(step())

    cadence(function (step) {

        [].forEach(step([], function (number) {
            item(number, step())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        deepEqual(items, [], 'step arrayed empty')

    })(step())

    cadence(function (step) {

        [ 1, 2, 3 ].forEach(step([], function (number) {
            if (number % 2) step()(null, number)
            else step()(null)
        }))

    }, function (items) {

        deepEqual(items, [ 1, 3 ], 'step arrayed missing')

    })(step())

    cadence(function (step) {

        [ 1 ].forEach(step([], function (number) {
            step(function () {}, function () { return number })
        }))

    }, function (items) {

        deepEqual(items, [ 1 ], 'step arrayed single')

    })(step())

})

function item (value, callback) {
    process.nextTick(function () { callback(null, value) })
}

