#!/usr/bin/env node

require('proof')(28, function (assert) {
    var cadence = require('../..')

    var object = {}

    // Simple example of a finalizer.
    cadence(function (async, object) {

        async([function () {
            assert(object.used, 'leading finalizer closed')
            object.closed = true
        }], function () {
            assert(!object.closed, 'leading finalizer open')
            object.used = true
            return object
        })

    })({}, function (error, object) {
        if (error) throw error
        assert(object.used, 'leading finalizer was used')
        assert(object.closed, 'leading finalizer was closed')
    })

    // Fixup finalizers run in the parent cadence.
    cadence(function (async, object) {

        async(function () {
            ! function (callback) {
                callback(null, object)
            } (async(async)([function (object) { object.closed = true }]))
        }, function (object) {
            assert(!object.closed, 'leading finalizer open')
            object.used = true
            return object
        })

    })({}, function (error, object) {

        if (error) throw error
        assert(object.used, 'leading finalizer was used')
        assert(object.closed, 'leading finalizer was closed')

    })

    // Finalizers run after explicit exit.
    cadence(function (async, object) {

        async(function () {
            ! function (callback) {
                callback(null, object)
            } (async(async)([function (object) { object.closed = true }]))
        }, function (object) {
            assert(!object.closed, 'on exit open')
            object.used = true
        }, function () {
            return [ object ]
        })

    })({}, function (error, object) {

        if (error) throw error
        assert(object.used, 'on exit was used')
        assert(object.closed, 'on exit was closed')

    })

      // Finalizers run with correct `this`.
      var self = {}
      cadence(function (async) {

        async(function () {
            ! function (callback) {
                callback(null, 1)
            } (async(async)([function (number) {
                assert(self === this, 'self is this')
                this.closed = number
            }]))
        }, [function () {
            assert(self === this, 'self is still this')
            this.closed++
        }], function () {
            assert(!this.closed, 'this open')
            this.used = true
        })

    }).call(self, {}, function (error) {

        if (error) throw error
        assert(self.used, 'this was used')
        assert(self.closed, 'this was closed')

    })

    var me = {}
    cadence(function (async) {

        async(function () {
            this.opened = true
        }, [function () {
            assert(me === this, 'this exit')
            this.opened = false
        }], function () {
            assert(this.opened, 'this exit open')
            this.used = true
        })

    }).call(me, {}, function (error) {

        if (error) throw error
        assert(me.used, 'this was used')
        assert(!me.opened, 'this was closed')

    })

    cadence(function (async, object) {
        var block = async(function () {
            async(function () {
                async([function () {
                    object.done = true
                }], function () {
                    return [ block, object ]
                }, function () {
                    throw new Error('should not run')
                })
            })
        })
    })({ value: 0 }, function (error, result) {
        assert(result.value, 0, 'returned at break')
        assert(result.done, 'finalized after break')
    })

    // Finalizers report their errors.
    cadence(function (async, object) {

        async(function () {
            ! function (callback) {
                callback(null, object)
            } (async(async)([function (object) { async()(new Error('finalizer')) }]))
        }, function (object) {
            assert(!object.closed, 'leading finalizer open')
            return object
        })

    })({}, function (error) {

        assert(error.message, 'finalizer', 'finalizer raised error')

    })

    // Finalizers do not run if they are not reached.
    var stopped
    cadence(function (async, object) {
        async(function () {
            throw new Error('errored')
        }, [function () {
            throw new Error('finalized')
            object.finalized = true
        }])

    })(stopped = {}, function (error) {
        assert(error.message, 'errored', 'error raised')
        assert(!stopped.finallized, 'finalizer not registered if not reached')
    })

    // Finalizers run in the reverse order in which they are declared.
    var stopped
    cadence(function (async, object) {
        async([function () {
            assert(object.finalizer, 1, 'reverse order')
            object.finalizer++
        }], function () {
            object.user = 1
        }, [function () {
            object.finalizer = 1
        }], function () {
            return object
        })

    })({}, function (error, object) {
        assert(object.user, 1, 'user function invoked between finalizers')
        assert(object.finalizer, 2, 'all finalizers invoked')
    })
})
