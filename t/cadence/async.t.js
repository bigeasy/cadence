#!/usr/bin/env node

require('proof')(2, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {
        step(function () {
            step()(null, 1)
        }, function (x) {
            assert(x, 1, 'sync')
        })
    })(step())

    cadence(function (step) {
        step(function () {
            step()(null, 1)
        }, function (x) {
            setImmediate(step(), null, x)
        }, function (x) {
            assert(x, 1, 'async')
        })
    })(step())
})
