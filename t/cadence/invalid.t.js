#!/usr/bin/env node

require('proof')(1, function (equal) {
    var cadence = require('../..')

    try {
        cadence(function (step) {
            step(1, 'a', 1)
        })(function () {})
    } catch (e) {
        equal(e.message, 'invalid arguments', 'invalid argument')
    }
})
