#!/usr/bin/env node

require('proof')(3, function (step, equal) {
    var fs = require('fs')
    var cadence = require('../..')
    var one = step()
    var two = step()

    cadence(function () {
        return 1
    }, function (number) {
        equal(number, 1, "return step")
    })()

    cadence(function () {
        return 1
    })(function (error, number) {
        equal(number, 1, "return cadence")
        one()
    })

    cadence(function (step) {
        step()(null, 1)
    })(function (error, number) {
        equal(number, 1, "callback cadence")
        two()
    })
})
