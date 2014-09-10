#!/usr/bin/env node

require('proof')(2, function (step, ok, equal) {
    var cadence = require('../..')

    cadence(function (step) {
        step(function () {
            return [ step, 1 ]
        }, function () {
            ok(false, 'should not be called')
        })
    })(function (error, number) {
        if (error) throw error
        equal(number, 1, 'early return')
    })

    cadence(function (step) {
        step(function () {
            throw new Error('abend')
        }, function () {
            ok(false, 'should not be called')
        })
    })(function (error) {
        if (error.message != 'abend') throw error
        equal(error.message, 'abend', 'early return with error')
    })
})
