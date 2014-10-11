#!/usr/bin/env node

require('proof')(6, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {

        async(function () {
            (function (callback) {
                callback(null, 1)
            })(async(async)(function (number) {
                return number + 1
            }))
        }, function (value) {
            assert(value, 2, 'fixup direct')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            (function (callback) {
                callback(new Error('errored'), 1)
            })(async(async)(function () {
                throw new Error('should not be called')
            }))
        }, function () {
            throw new Error('should not be called')
        })

    })(function (error) {
        assert(error.message, 'errored', 'fixup short circuit')
    })

    cadence(function (async) {

        echo(1, async(async)(function (number) {
            echo(- number, async())
        }))

    }, function (items) {

        assert(items, -1, 'fixup cadence')

    })(async())

    // This triggers a test of error handling when the fixup cadence errors,
    // whether the next object in the sub cadence recieves the error.
    cadence(function (async) {

        async(function () {

            echo(1, async(async)(function (number) {
                 throw new Error('errored')
            }))

        }, function () {

            throw new Error('should not be called')

        })

    })(function (error) {

        assert(error.message, 'errored', 'inner error')

    })

    cadence(function (async) {

        echo(1, async(async)(function (number) {
            throw new Error('thrown')
            echo(- number, async())
        }))

    })(function (error) {
        assert(error.message, 'thrown', 'errors')
    })

    cadence(function (async) {

        var numbers = async(async)([], function (number) { return - number })

        ; [ 1, 2, 3 ].forEach(function (number) {
            echo(number, numbers())
        })

    }, function (numbers) {

        assert(numbers, [ -1, -2, -3 ], 'fixup array cadence')

    })(async())
}))

function echo (value, callback) { process.nextTick(function () { callback(null, value) }) }
