#!/usr/bin/env node

require('proof')(1, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {

        item(1, async())

    }, function (number) {

        assert(number, 1, 'step')

    })(async())
}))

function item (number, callback) { callback(null, number) }
