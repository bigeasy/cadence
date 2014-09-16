#!/usr/bin/env node

require('proof')(1, function (assert) {
    var cadence = require('../..')

    cadence(function (step) {
        step(function () {
            cadence(function (step) {
                step(function () {
                    throw new Error('errored')
                })
            })(step())
        })
    })(function (error) {
        assert(error.message, 'errored', 'reentrant')
    })
})
