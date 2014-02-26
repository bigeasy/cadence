#!/usr/bin/env node

require('proof')(14, function (step, equal) {
    var cadence = require('../..')
    var one = step()
    var two = step()

    cadence(function () {
        return 1
    }, function (number) {
        equal(number, 1, 'return step')
    })()

    cadence(function () {
        return 1
    })(function (error, number) {
        equal(number, 1, 'return cadence')
        one()
    })

    cadence(function (step) {
        step()(null, 1)
    })(function (error, number) {
        equal(number, 1, 'callback cadence')
        two()
    })

    cadence(function () {
        return [ 1 ]
    })(function (error, number) {
        equal(number, 1, 'callback cadence arrayed')
    })

    cadence(function () {
        return [ 1, 2 ]
    })(function (error, one, two) {
        equal(one, 1, 'callback cadence arrayed ordered one')
        equal(two, 2, 'callback cadence arrayed ordered two')
    })

    cadence(function () {
        return [ [ 1, 2 ] ]
    })(function (error, array) {
        equal(array[0], 1, 'callback cadence array ordered one')
        equal(array[1], 2, 'callback cadence array ordered two')
    })

    cadence(function (step) {
        step(function () {
            step()(null, 1, 2)
        }, function (one, two) {
            equal(one, 1, 'return undefined ignore one')
            equal(two, 2, 'return undefined ignore two')
        }, function (one, two) {
            equal(one, 1, 'return undefined one')
            equal(two, 2, 'return undefined two')
        })
    })(function (error, one, two) {
        equal(one, 1, 'return propagate one')
        equal(two, 2, 'return propagate two')
    })
})
