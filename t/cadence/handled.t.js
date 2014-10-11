#!/usr/bin/env node

require('proof')(2, function (assert) {
    var cadence = require('../..')

    cadence(function () {

        throw new Error('thrown')

    })(function (error) {
        assert(error.message, 'thrown', 'handled throw')
    })

    cadence(function (async) {

        async()(new Error('handed'))

    })(function (error) {
        assert(error.message, 'handed', 'unhandled error')
    })

})
