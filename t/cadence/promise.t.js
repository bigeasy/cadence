#!/usr/bin/env node

require('proof')(2, function (step, equal) {
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

    cadence(function (step) {
        step(function () {
            step(new Bogus(null, 1))
        }, function (one) {
            equal(one, 1, 'promise')
        })
    })(step())

    cadence(function (step) {
        step([function () {
            step(new Bogus('error'))
        }, function (_, error) {
            equal(error.message, 'error', 'betrayal')
        }])
    })(step())
})
