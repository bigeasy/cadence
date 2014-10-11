#!/usr/bin/env node

require('proof')(2, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {
        async(function () {
            return [ async, 1 ]
        }, function () {
            assert(false, 'should not be called')
        })
    })(function (error, number) {
        if (error) throw error
        assert(number, 1, 'early return')
    })

    cadence(function (async) {
        async(function () {
            throw new Error('abend')
        }, function () {
            assert(false, 'should not be called')
        })
    })(function (error) {
        if (error.message != 'abend') throw error
        assert(error.message, 'abend', 'early return with error')
    })
}))
