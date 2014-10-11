#!/usr/bin/env node

require('proof')(1, function (assert) {
    var cadence = require('../..')

    cadence(function (async) {
        async(function () {
            cadence(function (async) {
                async(function () {
                    throw new Error('errored')
                })
            })(async())
        })
    })(function (error) {
        assert(error.message, 'errored', 'reentrant')
    })
})
