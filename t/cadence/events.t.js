#!/usr/bin/env node

require('proof')(11, function (step, assert) {
    var EventEmitter = require('events').EventEmitter
    var cadence = require('../..')
    var ee

    var ev = require('../../event').configure({ on: 'on' })

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(null, []))
            ee.on('end', step(null))
        }, function (data) {
            assert(data, [ 1, 2, 3 ], 'events')
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
            ee.on('end', step(null))
        })
    })(ee, function (error) {
        assert(error.message, 'error', 'error event')
    })

    ee.emit('error', new Error('error'))

    ee = new EventEmitter()

    cadence(function (step, ees) {
      step(function () {
          ee.on('error', step(Error))
          ee.on('end', step(null))
      }, function (end) {
          assert(end, 'ended', 'error ignored')
      })
    })([ ee, new EventEmitter, new EventEmitter ], step())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(null, []))
            ee.on('end', step(null))
        }, function (data, ended) {
            assert(data, [], 'arrayed event with no values')
            assert(ended, 'ended', 'arrayed event with no values ended')
        })
    })(ee, step())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            ee.on('data', step(null, 2, []))
            ee.on('end', step(null))
        }, function (first, second, ended) {
            assert(second, [], 'arrayed event with specific arity')
            assert(ended, 'ended', 'arrayed event with specific arity ended')
        })
    })(ee, step())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (step, ee) {
        step(function () {
            step(ev, ee).on('data', []).on('end').on(Error)
        }, function (data, ended) {
            assert(data, [ 1, 2, 3 ], 'builder data')
            assert(ended, 'ended', 'builder ended')
        })
    })(ee, step())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end', 'ended')

    cadence(function (step, ee) {
        step(function () {
            step(ev, ee, 'data', []).on('end').on('error', Error)
        }, function (data, ended) {
            assert(data, [ 1, 2, 3 ], 'builder intializer data')
            assert(ended, 'ended', 'builder intializer ended')
        })
    })(ee, step())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end', 'ended')
})
