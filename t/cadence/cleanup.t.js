#!/usr/bin/env node

require('proof')(1, require('../..')(function (async, assert) {
    var cadence = require('../..')
    function echo (value, callback) {
        setImmediate(function () { callback(null, value) })
    }
    cadence(function (async) {
        var order = []
        async(function () {
            async(function () {
                setImmediate(async())
            }, function () {
                order.push('first')
            })
            echo(1, async())
            async([function () { order.push('second') }])
        }, function (value) {
            order.push('third')
            assert(order, [ 'first', 'second', 'third' ], 'cleanup')
        })

    })(async())
}))
