#!/usr/bin/env node

require('proof')(1, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../../minimal')

    var f = cadence(function (async) {

        item(1, async())

    }, function (number) {

        assert(number, 1, 'step')

    })

    f(async())
}

function item (number, callback) { callback(null, number) }
