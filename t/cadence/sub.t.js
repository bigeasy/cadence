#!/usr/bin/env node

require('proof')(12, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {

        async(function () { return 1 })
        async(function () { return 2 })

    })(function (error, one, two) {

        assert(one, 1, 'callback')
        assert(two, 2, 'two callback')

    })

    cadence(function (async) {

        async(function () {
            async(function () {
                async()(new Error('errored'))
            })
        }, function () {
            throw new Error('should not be called')
        })

    })(function (error) {

        assert(error.message, 'errored', 'error')

    })

    cadence(function (async) {

        if (!async) throw new Error

        async([function () {
            async(function () {
                async()(new Error('errored'))
            })
        }, function (_, error) {
            assert(error.message, 'errored', 'error caught')
        }])

    })(async())

    cadence(function (async) {

        [ 1, 2, 3 ].forEach(async([], function (number) {
            item(number, async())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        assert(items, [ -1, -2, -3 ], 'callback arrayed')

    })(async())

    cadence(function (async) {

        [ 1, 2 ].forEach(async([], function (number) {
            async()(null, number)
            async()(null, number + 1)
        }))

    }, function (first, second) {

        assert(first, [ 1, 2 ], 'arrayed multi return one')
        assert(second, [ 2, 3 ], 'arrayed multi return two')

    })(async())

    cadence(function (async) {

        [].forEach(async([], function (number) {
            item(number, async())
        }, function (number) {
            return - number
        }))

    }, function (items) {

        assert(items, [], 'callback arrayed empty')

    })(async())

    cadence(function (async) {

        [ 1, 2, 3 ].forEach(async([], function (number) {
            if (number % 2) async()(null, number)
            else async()(null)
        }))

    }, function (items) {

        assert(items[0], 1, 'callback arrayed missing 1')
        assert(items[1], (void(0)), 'callback arrayed missing 2')
        assert(items[2], 3, 'callback arrayed missing 3')

    })(async())

    cadence(function (async) {

        [ 1 ].forEach(async([], function (number) {
            async(function () {}, function () { return number })
        }))

    }, function (items) {

        assert(items, [ 1 ], 'callback arrayed single')

    })(async())

}))

function item (value, callback) {
    process.nextTick(function () { callback(null, value) })
}

