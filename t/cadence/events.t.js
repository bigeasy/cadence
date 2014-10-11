#!/usr/bin/env node

require('proof')(11, require('../..')(function (async, assert) {
    var EventEmitter = require('events').EventEmitter
    var cadence = require('../..')
    var ee

    var ev = require('../../event').configure({ on: 'on' })

    ee = new EventEmitter()

    cadence(function (async, ee) {
        async(function () {
            ee.on('data', async(null, []))
            ee.on('end', async(null))
        }, function (data) {
            assert(data, [ 1, 2, 3 ], 'events')
        })
    })(ee, async())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end')

    ee = new EventEmitter()

    cadence(function (async, ee) {
        async(function () {
            ee.on('error', async(Error))
            ee.on('end', async(null))
        })
    })(ee, function (error) {
        assert(error.message, 'error', 'error event')
    })

    ee.emit('error', new Error('error'))

    ee = new EventEmitter()

    cadence(function (async, ees) {
      async(function () {
          ee.on('error', async(Error))
          ee.on('end', async(null))
      }, function (end) {
          assert(end, 'ended', 'error ignored')
      })
    })([ ee, new EventEmitter, new EventEmitter ], async())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (async, ee) {
        async(function () {
            ee.on('data', async(null, []))
            ee.on('end', async(null))
        }, function (data, ended) {
            assert(data, [], 'arrayed event with no values')
            assert(ended, 'ended', 'arrayed event with no values ended')
        })
    })(ee, async())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (async, ee) {
        async(function () {
            ee.on('data', async(null, 2, []))
            ee.on('end', async(null))
        }, function (first, second, ended) {
            assert(second, [], 'arrayed event with specific arity')
            assert(ended, 'ended', 'arrayed event with specific arity ended')
        })
    })(ee, async())

    ee.emit('end', 'ended')

    ee = new EventEmitter()

    cadence(function (async, ee) {
        async(function () {
            async(ev, ee).on('data', []).on('end').on(Error)
        }, function (data, ended) {
            assert(data, [ 1, 2, 3 ], 'builder data')
            assert(ended, 'ended', 'builder ended')
        })
    })(ee, async())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end', 'ended')

    cadence(function (async, ee) {
        async(function () {
            async(ev, ee, 'data', []).on('end').on('error', Error)
        }, function (data, ended) {
            assert(data, [ 1, 2, 3 ], 'builder intializer data')
            assert(ended, 'ended', 'builder intializer ended')
        })
    })(ee, async())

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('end', 'ended')
}))
