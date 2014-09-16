#!/usr/bin/env node

require('proof')(6, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {

        step()(null, 1)
        step()(null, 2)

    }, function (first, second) {

        assert(first, 1, 'first')
        assert(second, 2, 'second')

    })(step())

    cadence(function (step) {

        step(2)(null)
        step()(null, 3)
        step()(null, null)

    }, function (first, second, third, fourth) {

        assert(first === (void 0), 'first undefined')
        assert(second === (void 0), 'second undefined')
        assert(third, 3, 'third not undefined')
        assert(fourth === null, 'fourth null')

    })(step())
})
