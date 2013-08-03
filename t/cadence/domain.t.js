#!/usr/bin/env node

require('proof')(2, function (step, equal, ok) {
    var cadence = require('../..')
    var domain = require('../../domain')
    var events = require('events')

    cadence(domain(function (step) {
        step(function () {
            new events.EventEmitter().emit('error', new Error('emitted'))
        })
    }))(function (error) {
        equal(error.message, 'emitted', 'error emitted')
    })

    cadence(domain(function (step) {
        step(function () {
            process.nextTick()
        }, function () {
            new events.EventEmitter().emit('error', new Error('emitted'))
        })
    }))(function (error) {
        equal(error.message, 'emitted', 'error emitted')
    })
})
