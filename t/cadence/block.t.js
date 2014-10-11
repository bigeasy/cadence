#!/usr/bin/env node

require('proof')(4, require('../..')(function (async, assert) {
    var cadence = require('../..')
    cadence(function (async) {
        var block = async(function () {
            async(function () {
                return [ block, 1 ]
            }, function () {
                throw new Error
            })
        })
    })(function (error, result) {
        assert(!error, 'no errors')
        assert(result, 1, 'exit block')
    })

    cadence(function (async) {
        async(function () {
            async(function () {
                return [ async, 1 ]
            }, function () {
                throw new Error
            })
        })
    })(function (error, result) {
        assert(!error, 'step out no errors')
        assert(result, 1, 'step out exit block')
    })
}))
