#!/usr/bin/env node

require('proof')(1, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {

        item(1, step())

    }, function (number) {

        assert(number, 1, 'step')

    })(step())
})

function item (number, callback) { callback(null, number) }
