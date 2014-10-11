#!/usr/bin/env node

require('proof')(3, require('../..')(function (async, assert) {
    var cadence = require('../..')
    var object = {}
    object.method = cadence(function (async) {
        async(function () {
            async(async)(function () {
                assert(this === object, 'inside')
                this.value = 1
                return this
            })(null)
        })
    })

    object.method(function (error, result)  {
        assert(result === object, 'this')
        assert(object.value, 1, 'value')
    })
}))
