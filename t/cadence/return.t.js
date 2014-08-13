#!/usr/bin/env node

require('proof')(15, function (step, assert) {
    var cadence = require('../..')
    var one = step()
    var two = step()

    cadence(function () {
        return 1
    }, function (number) {
        assert(number, 1, 'return step')
    })()

    cadence(function () {
        return 1
    })(function (error, number) {
        assert(number, 1, 'return cadence')
        one()
    })

    cadence(function (step) {
        step()(null, 1)
    })(function (error, number) {
        assert(number, 1, 'callback cadence')
        two()
    })

    cadence(function () {
        return [ 1 ]
    })(function (error, number) {
        assert(number, 1, 'callback cadence arrayed')
    })

    cadence(function () {
        return [ 1, 2 ]
    })(function (error, one, two) {
        assert(one, 1, 'callback cadence arrayed ordered one')
        assert(two, 2, 'callback cadence arrayed ordered two')
    })

    cadence(function () {
        return [ [ 1, 2 ] ]
    })(function (error, array) {
        assert(array[0], 1, 'callback cadence array ordered one')
        assert(array[1], 2, 'callback cadence array ordered two')
    })

    cadence(function (step) {
        step(function () {
            step()(null, 1, 2)
        }, function (one, two) {
            assert(one, 1, 'return undefined ignore one')
            assert(two, 2, 'return undefined ignore two')
        }, function (one, two) {
            assert(one, 1, 'return undefined one')
            assert(two, 2, 'return undefined two')
        })
    })(function (error, one, two) {
        assert(one, 1, 'return propagate one')
        assert(two, 2, 'return propagate two')
    })

    cadence(function (step) {
        var loop = step(function () {
            return [ loop, [ 1, 2 ] ]
        })()
    })(function (error, array) {
        assert(array, [ 1, 2 ], 'break return array')
    })
})
