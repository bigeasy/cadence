#!/usr/bin/env node

require('proof')(4, function (step, assert) {
    var cadence = require('../..')
    cadence(function (step) {
        var block = step(function () {
            step(function () {
                return [ block, 1 ]
            }, function () {
                throw new Error
            })
        })
    })(function (error, result) {
        assert(!error, 'no errors')
        assert(result, 1, 'exit block')
    })

    cadence(function (step) {
        step(function () {
            step(function () {
                return [ step, 1 ]
            }, function () {
                throw new Error
            })
        })
    })(function (error, result) {
        assert(!error, 'step out no errors')
        assert(result, 1, 'step out exit block')
    })
})
