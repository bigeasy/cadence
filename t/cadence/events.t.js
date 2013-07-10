#!/usr/bin/env node

require('proof')(7, function (equal, ok, step, deepEqual) {
    var EventEmitter = require('events').EventEmitter
    var cadence = require('../..')
    var ee

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(-1, []))
            ee.on('end', step(-1))
        }, function (data) {
            deepEqual(data, [ 1, 2, 3 ], 'events')
        })
    })(ee, step())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('error', step(Error))
            ee.on('end', step(-1))
        })
    })(ee, function (error) {
        equal(error.message, 'error', 'error event')
    })

    ee.emit('error', new Error('error'))

    ee = new EventEmitter()

    cadence(function (step, ees) {
      step(function () {
          ee.on('error', step(Error))
          ee.on('end', step(-1))
      }, function (end) {
          equal(end, 'ended', 'error ignored')
      })
    })([ ee, new EventEmitter, new EventEmitter ], step())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(-1, []))
            ee.on('end', step(-1))
        }, function (data, ended) {
            deepEqual(data, [], 'arrayed event with no values')
            equal(ended, 'ended', 'arrayed event with no values ended')
        })
    })(ee, step())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(-1, 2, []))
            ee.on('end', step(-1))
        }, function (first, second, ended) {
            deepEqual(second, [], 'arrayed event with specific arity')
            equal(ended, 'ended', 'arrayed event with specific arity ended')
        })
    })(ee, step())

    ee.emit('end', 'ended')
})
