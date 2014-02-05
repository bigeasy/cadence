#!/usr/bin/env node

require('proof')(8, function (step, equal) {
    var fs = require('fs')
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
})
