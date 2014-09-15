#!/usr/bin/env node

require('proof')(1, function (step, assert) {
    var cadence = require('../..')
    function echo (value, callback) {
        setImmediate(function () { callback(null, value) })
    }
    cadence(function (step) {
        var order = []
        step(function () {
            step(function () {
                setImmediate(step())
            }, function () {
                order.push('first')
            })
            echo(1, step())
            step([function () { order.push('second') }])
        }, function (value) {
            order.push('third')
            assert(order, [ 'first', 'second', 'third' ], 'cleanup')
        })

    })(step())
})
