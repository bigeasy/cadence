#!/usr/bin/env node

require('proof')(2, function (equal) {
    var fs = require('fs')
    var cadence = require('../..')

    cadence(function (step) {
        var inc
        step(function () {
            step()(null, 0)
        }, inc = function (count) {
            step()(null, count + 1)
        }, function (count) {
            if (count != 10) step.jump(inc)
            return count
        })
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'jump')
    })

    cadence(function (step) {
        var inc
        step(function () {
            step()(null, 0)
        }, inc = function (count) {
            step()(null, count + 1)
        }, function (count) {
            step(function () {
                if (count != 10) step.jump(inc)
                return count
            })
        })
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'jump up')
    })
})
