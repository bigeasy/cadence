#!/usr/bin/env node

require('proof')(2, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../../minimal')

    var f = cadence(function (async) {
        async(function () {
            item(1, async())
        }, function (number) {
            assert(number, 1, 'step')
            return 1
        })
    })

    async(function () {
        f(async())
    }, function (result) {
        assert(result, 1, 'returned')
    })
}

function item (number, callback) { callback(null, number) }
