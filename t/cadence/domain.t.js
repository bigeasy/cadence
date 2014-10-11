#!/usr/bin/env node

require('proof')(2, require('../..')(function (async, assert) {
    var cadence = require('../..')
    var domain = require('../../domain')
    var events = require('events')

    cadence(domain(function (async) {
        async(function () {
            new events.EventEmitter().emit('error', new Error('emitted'))
        })
    }))(function (error) {
        assert(error.message, 'emitted', 'error emitted')
    })

    async([function () {
        cadence(domain(function (async) {
            async(function () {
                process.nextTick(async())
            }, function () {
                new events.EventEmitter().emit('error', new Error('emitted'))
            })
        }))(async())
    }, function (errors, error) {
        assert(error.message, 'emitted', 'error emitted 2')
    }])
}))
