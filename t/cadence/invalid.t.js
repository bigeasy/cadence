#!/usr/bin/env node

require('proof')(1, function (assert) {
    var cadence = require('../..')

    try {
        cadence(function (async) {
            async(1, 'a', 1)
        })(function () {})
    } catch (e) {
        assert(e.message, 'invalid arguments', 'invalid argument')
    }
})
