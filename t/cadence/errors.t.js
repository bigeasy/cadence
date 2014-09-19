#!/usr/bin/env node

require('proof')(25, function (step, assert) {
    var cadence = require('../..')
    var errors = []

    cadence(function () {
        throw new Error('thrown')
    })(function (error) {
        assert(error.message, 'thrown', 'intercepted throw')
    })

    cadence(function (step) {
        function foo () { foo() }
        step(function () { foo() })
    })(function (error) {
        assert(/stack/.test(error.message), 'stack overflow')
    })

    cadence(function (step) {
        function foo () {}
        throw (void(0))
    })(function (error) {
        assert(error === undefined, 'throw undefined')
    })

    var self = {}
    cadence([function (step) {
        step()(new Error('handled'))
    }, function (errors) {
        assert(self === this)
        assert(errors[0].message, 'handled', 'intercepted passed along')
    }]).call(self)

    cadence([function (step) {
        step()()
    }, function (error) {
        throw new Error('should not be called')
    }], function () {
        assert(true, 'no error')
    })()

    cadence([function (step) {
        step()(new Error('one'))
        step()(new Error('two'))
        step()()
    }, function (errors, error) {
        assert(errors.length, 2, 'got all errors')
        assert(errors[0].message, error.message, 'first error is second argument')
    }])()

    cadence([function (step) {
        step()(null, 1)
    }, function () {
    }], function (number) {
        assert(number, 1, 'no error with value')
    })()

    try {
        cadence(function () {
            throw new Error('exceptional')
        })()
    } catch (e) {
        assert(e.message, 'exceptional', 'default error handler')
    }

    cadence([function (step) {
        step()(new Error('handled'))
    }, /handle/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught regex')
    }])()

    cadence([function (step) {
        throw new Error
    }, function (error) {
        return 1
    }], function (number) {
        assert(number, 1, 'handled and value changed')
    })()

    cadence([function (step) {
        var error = new Error('handled')
        error.code = 'ENOENT'
        step()(error)
    }, /ENOENT/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught code regex')
    }])()

    cadence([function (step) {
        step()(new Error('handled'))
    }, 'message', /handle/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught named field regex')
    }])()

    cadence([function (step) {
          step()(new Error('handled'))
    }, 'message', /bogus/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        assert(error.message, 'handled', 'condtionally caught failure')
    })

    cadence([function (step) {
        step()(new Error('handled'))
        step()(new Error('unhandled'))
    }, 'message', /^(handled)$/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        assert(error.message, 'unhandled', 'condtionally caught did not catch all')
    })

    cadence([function (step) {
        step([function () {
            step()(new Error('handled'))
            step()(new Error('unhandled'))
        }, 'message', /^(handled)$/, function (errors) {
            throw new Error('should not get here')
        }])
    }, function (errors) {
        assert(errors.length, 2, 'got all errors')
        assert(errors[0].message, 'handled', 'errors still in order one')
        assert(errors[1].message, 'unhandled', 'errors still in order two')
        throw errors
    }])(function (error) {
        assert(error.message, 'handled', 'uncaughtedness reset')
    })

    cadence(function (step) {
        step([function () {
            throw new Error
        }, function () {
            return [ step ]
        }], function () {
            throw new Error('branch called')
        })
    })(function (error) {
        assert(!error, 'error was thrown')
    })

    var dirty = true
    try {
        cadence(function (step) {
            step([function () {
                dirty = false
            }], function () {
                step(function () {
                    return [ step ]
                })
                throw Error('propagated')
            }, function () {
                process.exit(1)
            })
        })(function (error) {
            if (error) throw error
        })
    } catch (e) {
        assert(!dirty, 'finalizer ran')
        assert(e.message, 'propagated', 'propagated')
    }

    var domain = require('domain').create(), wait = step()
    domain.on('error', function (e) {
        assert(!dirty, 'finalizer ran')
        assert(e.message, 'propagated', 'domain propagated')
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
                    return [ step ]
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
