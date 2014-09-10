#!/usr/bin/env node

require('proof')(2, function (step, assert) {
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
})
