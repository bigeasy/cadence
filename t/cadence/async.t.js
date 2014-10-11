#!/usr/bin/env node

require('proof')(2, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {
        async(function () {
            async()(null, 1)
        }, function (x) {
            assert(x, 1, 'sync')
        })
    })(async())

    cadence(function (async) {
        async(function () {
            async()(null, 1)
        }, function (x) {
            setImmediate(async(), null, x)
        }, function (x) {
            assert(x, 1, 'async')
        })
    })(async())
}))
