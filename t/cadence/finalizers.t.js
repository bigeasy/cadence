#!/usr/bin/env node

require('proof')(21, function (equal, ok) {
    var cadence = require('../..')

    var object = {}

    // Simple example of a finalizer.
    cadence(function (step, object) {

        step([function () {
            ok(object.used, 'leading finalizer closed')
            object.closed = true
        }], function () {
            ok(!object.closed, 'leading finalizer open')
            object.used = true
            return object
        })

    })({}, function (error, object) {
        if (error) throw error
        ok(object.used, 'leading finalizer was used')
        ok(object.closed, 'leading finalizer was closed')
    })

    // Fixup finalizers run in the parent cadence.
    cadence(function (step, object) {

        step(function () {
            ! function (callback) {
                callback(null, object)
            } (step(step, [function (object) { object.closed = true }]))
        }, function (object) {
            ok(!object.closed, 'leading finalizer open')
            object.used = true
            return object
        })

    })({}, function (error, object) {

        if (error) throw error
        ok(object.used, 'leading finalizer was used')
        ok(object.closed, 'leading finalizer was closed')

    })

    // Finalizers run after explicit exit.
    cadence(function (step, object) {

        step(function () {
            ! function (callback) {
                callback(null, object)
            } (step(step, [function (object) { object.closed = true }]))
        }, function (object) {
            ok(!object.closed, 'on exit open')
            object.used = true
        }, function () {
            step(null, object)
        })

    })({}, function (error, object) {

        if (error) throw error
        ok(object.used, 'on exit was used')
        ok(object.closed, 'on exit was closed')

    })

      // Finalizers run with correct `this`.
      var self = {}
      cadence(function (step) {

        step(function () {
            ! function (callback) {
                callback(null, 1)
            } (step(step, [function (number) {
                ok(self === this, 'self is this')
                this.closed = number
            }]))
        }, [function () {
            ok(self === this, 'self is still this')
            this.closed++
        }], function () {
            ok(!this.closed, 'this open')
            this.used = true
        })

    }).call(self, {}, function (error) {

        if (error) throw error
        ok(self.used, 'this was used')
        ok(self.closed, 'this was closed')

    })

    var me = {}
    cadence(function (step) {

        step(function () {
            this.opened = true
        }, [function () {
            ok(me === this, 'this exit')
            this.opened = false
        }], function () {
            ok(this.opened, 'this exit open')
            this.used = true
        })

    }).call(me, {}, function (error) {

        if (error) throw error
        ok(me.used, 'this was used')
        ok(!me.opened, 'this was closed')

    })

    // Finalizers report their errors.
    cadence(function (step, object) {

        step(function () {
            ! function (callback) {
                callback(null, object)
            } (step(step, [function (object) { step()(new Error('finalizer')) }]))
        }, function (object) {
            ok(!object.closed, 'leading finalizer open')
            return object
        })

    })({}, function (error) {

        ok(error.message, 'finalizer', 'finalizer raised error')

    })
})
