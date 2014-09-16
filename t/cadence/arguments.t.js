#!/usr/bin/env node

require('proof')(2, function (step, assert) {
    var cadence = require('../..')
    cadence(function (step, number, letter) {
        assert(number, 1, 'first argument')
        assert('a', letter, 'second argument')
    })(1, 'a', step())
})
