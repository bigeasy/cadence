#!/usr/bin/env node

require('proof')(22, function (step, equal, ok) {
    var cadence = require('../..')
    var errors = []

    cadence(function () {
        throw new Error('thrown')
    })(function (error) {
        equal(error.message, 'thrown', 'intercepted throw')
    })

    var self = {}
    cadence([function (step) {
        step()(new Error('handled'))
    }, function (errors) {
        ok(self === this)
        equal(errors[0].message, 'handled', 'intercepted passed along')
    }]).call(self)

    cadence([function (step) {
        step()()
    }, function (error) {
        throw new Error('should not be called')
    }], function () {
        ok(true, 'no error')
    })()

    cadence([function (step) {
        step()(new Error('one'))
        step()(new Error('two'))
        step()()
    }, function (errors, error) {
        equal(errors.length, 2, 'got all errors')
        equal(errors[0].message, error.message, 'first error is second argument')
    }])()

    cadence([function (step) {
        step()(null, 1)
    }, function () {
    }], function (number) {
        equal(number, 1, 'no error with value')
    })()

    try {
        cadence(function () {
            throw new Error('exceptional')
        })()
    } catch (e) {
        equal(e.message, 'exceptional', 'default error handler')
    }

    cadence([function (step) {
        step()(new Error('handled'))
    }, /handle/, function (errors) {
        equal(errors[0].message, 'handled', 'condtionally caught regex')
    }])()

    cadence([function (step) {
        throw new Error
    }, function (error) {
        return 1
    }], function (number) {
        equal(number, 1, 'handled and value changed')
    })()

    cadence([function (step) {
        var error = new Error('handled')
        error.code = 'ENOENT'
        step()(error)
    }, /ENOENT/, function (errors) {
        equal(errors[0].message, 'handled', 'condtionally caught code regex')
    }])()

    cadence([function (step) {
        step()(new Error('handled'))
    }, 'message', /handle/, function (errors) {
        equal(errors[0].message, 'handled', 'condtionally caught named field regex')
    }])()

    cadence([function (step) {
          step()(new Error('handled'))
    }, 'message', /bogus/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        equal(error.message, 'handled', 'condtionally caught failure')
    })

    cadence([function (step) {
        step()(new Error('handled'))
        step()(new Error('unhandled'))
    }, 'message', /^(handled)$/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        equal(error.message, 'unhandled', 'condtionally caught did not catch all')
    })

    cadence([function (step) {
        step([function () {
            step()(new Error('handled'))
            step()(new Error('unhandled'))
        }, 'message', /^(handled)$/, function (errors) {
            throw new Error('should not get here')
        }])
    }, function (errors) {
        equal(errors.length, 2, 'got all errors')
        equal(errors[0].message, 'handled', 'errors still in order one')
        equal(errors[1].message, 'unhandled', 'errors still in order two')
        throw errors
    }])(function (error) {
        equal(error.message, 'handled', 'uncaughtedness reset')
    })

    var dirty = true
    try {
        cadence(function (step) {
            step([function () {
                dirty = false
            }], function () {
                step(function () {
                    step(null)
                })
                throw Error('propagated')
            }, function () {
                process.exit(1)
            })
        })(function (error) {
            if (error) throw error
        })
    } catch (e) {
        ok(!dirty, 'finalizer ran')
        equal(e.message, 'propagated', 'propagated')
    }

    var domain = require('domain').create(), wait = step()
    domain.on('error', function (e) {
        ok(!dirty, 'finalizer ran')
        equal(e.message, 'propagated', 'propagated')
        wait()
    })
    domain.run(function () {
        cadence(function (step) {
            step([function () {
                dirty = false
            }], function () {
                step(function () {
                    process.nextTick(step())
                }, function () {
                    step(null)
                }, function () {
                    console.log('should not get here')
                    process.exit(1)
                })
                throw Error('propagated')
            }, function () {
                process.exit(1)
            })
        })(function (error) {
            if (error) throw error
        })
    })
})
