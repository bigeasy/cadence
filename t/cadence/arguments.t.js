#!/usr/bin/env node

require('proof')(2, require('../..')(function (async, assert) {
    var cadence = require('../..')
    cadence(function (async, number, letter) {
        assert(number, 1, 'first argument')
        assert('a', letter, 'second argument')
    })(1, 'a', async())
}))
