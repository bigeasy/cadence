#!/usr/bin/env node

require('proof')(2, function (step, ok, equal) {
    var cadence = require('../..')
    var object = {}

    object.method = cadence(function (step, value) {
        step('value')(null, value)
    })

    object.method(1, function (error, result)  {
        equal(result, 1, 'result')
        equal(object.value, 1, 'property')
    })
})
