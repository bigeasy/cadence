#!/usr/bin/env node

require('proof')(2, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {
        step(function () {
            return [ step, 1 ]
        }, function () {
            assert(false, 'should not be called')
        })
    })(function (error, number) {
        if (error) throw error
        assert(number, 1, 'early return')
    })

    cadence(function (step) {
        step(function () {
            throw new Error('abend')
        }, function () {
            assert(false, 'should not be called')
        })
    })(function (error) {
        if (error.message != 'abend') throw error
        assert(error.message, 'abend', 'early return with error')
    })
})
