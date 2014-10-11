#!/usr/bin/env node

require('proof')(6, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {

        async()(null, 1)
        async()(null, 2)

    }, function (first, second) {

        assert(first, 1, 'first')
        assert(second, 2, 'second')

    })(async())

    cadence(function (async) {

        async(2)(null)
        async()(null, 3)
        async()(null, null)

    }, function (first, second, third, fourth) {

        assert(first === (void 0), 'first undefined')
        assert(second === (void 0), 'second undefined')
        assert(third, 3, 'third not undefined')
        assert(fourth === null, 'fourth null')

    })(async())
}))
