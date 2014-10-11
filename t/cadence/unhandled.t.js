#!/usr/bin/env node

require('proof')(4, function (assert) {
    var cadence = require('../..')

    try {
        cadence(function () {

            throw new Error('thrown')

        })()
    } catch (error) {
        assert(error.message, 'thrown', 'unhandled throw')
    }

    try {
        cadence(function (async) {

            async()(new Error('handed'))

        })()
    } catch (error) {
        assert(error.message, 'handed', 'unhandled error')
    }

    cadence(function (async) {
        async()(new Error('one'))
        async()(new Error('two'))
    })(function (error) {
        assert(error.message, 'one', 'got first error from default handler')
    })

    try {
        cadence(function () {})()
        assert(1, 'no exception')
    } catch (e) {
        assert(0, 'no exception')
    }
})
