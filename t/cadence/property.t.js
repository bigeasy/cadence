#!/usr/bin/env node

require('proof')(4, require('../..')(function (async, assert) {
    var cadence = require('../..')
    var object = {}

    object.scalar = cadence(function (async, value) {
        async('value')(null, value)
    })

    object.arrayed = cadence(function (async, value) {
        [ 1, 2, 3 ].forEach(async('values', [], function (number) {
            return number
        }))
    })

    object.scalar(1, function (error, result)  {
        assert(result, 1, 'result')
        assert(object.value, 1, 'property')
    })

    object.arrayed(1, function (error, result)  {
        assert(result, [ 1, 2, 3 ], 'result')
        assert(object.values, [ 1, 2, 3 ], 'property')
    })
}))
