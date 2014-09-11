#!/usr/bin/env node

require('proof')(1, function (step, equal) {
    var cadence = require('../..')
    try {
        cadence(function (step, number, letter) {
            step(null)
        })()
    } catch (e) {
        equal(e.message, 'outgoing', 'outgoing')
    }
})
