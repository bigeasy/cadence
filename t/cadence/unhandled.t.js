#!/usr/bin/env node

require('proof')(4, function (ok, equal) {
    var cadence = require('../..')

    try {
        cadence(function () {

            throw new Error('thrown')

        })()
    } catch (error) {
        equal(error.message, 'thrown', 'unhandled throw')
    }

    try {
        cadence(function (step) {

            step()(new Error('handed'))

        })()
    } catch (error) {
        equal(error.message, 'handed', 'unhandled error')
    }

    cadence(function (step) {
        step()(new Error('one'))
        step()(new Error('two'))
    })(function (error) {
        equal(error.message, 'one', 'got first error from default handler')
    })

    try {
        cadence(function () {})()
        ok(1, 'no exception')
    } catch (e) {
        ok(0, 'no exception')
    }
})
