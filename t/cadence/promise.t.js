#!/usr/bin/env node

require('proof')(2, require('../..')(function (async, assert) {
    var cadence = require('../..')

    function Bogus (erroneous, value) {
        setImmediate(function () {
            if (erroneous) {
                this._error(new Error(erroneous))
            } else {
                this._success(value)
            }
        }.bind(this))
    }

    Bogus.prototype.then = function (success, error) {
        this._success = success
        this._error = error
    }

    cadence(function (async) {
        async(function () {
            async(new Bogus(null, 1))
        }, function (one) {
            assert(one, 1, 'promise')
        })
    })(async())

    cadence(function (async) {
        async([function () {
            async(new Bogus('error'))
        }, function (_, error) {
            assert(error.message, 'error', 'betrayal')
        }])
    })(async())
}))
