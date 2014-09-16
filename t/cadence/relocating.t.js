#!/usr/bin/env node

require('proof')(1, function (assert) {
    var cadence = require('../..')
    cadence(function (step) {
        step(step, function () {})
    })(function (error) {
        assert(error.message, 'relocating', 'relocating')
    })
})
