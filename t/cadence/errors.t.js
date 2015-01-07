#!/usr/bin/env node

require('proof')(24, require('../..')(function (async, assert) {
    var cadence = require('../..')
    var errors = []

    // bug #272
    cadence(function (async) {
        async([function () {
        }, function () {
            throw new Error('do not call')
        }], function () {
        }, function () {
            throw new Error('thrown')
        })
    })(function (error) {
        assert(error.message, 'thrown', 'overzealous catch blocks: 272')
    })

    cadence(function () {
        throw new Error('thrown')
    })(function (error) {
        assert(error.message, 'thrown', 'intercepted throw')
    })

    cadence(function (async) {
        function foo () { foo() }
        async(function () { foo() })
    })(function (error) {
        assert(/stack/.test(error.message), 'stack overflow')
    })

    cadence(function (async) {
        function foo () {}
        throw (void(0))
    })(function (error) {
        assert(error === undefined, 'throw undefined')
    })

    var self = {}
    cadence([function (async) {
        async()(new Error('handled'))
    }, function (errors) {
        assert(self === this)
        assert(errors[0].message, 'handled', 'intercepted passed along')
    }]).call(self)

    cadence([function (async) {
        async()()
    }, function (error) {
        throw new Error('should not be called')
    }], function () {
        assert(true, 'no error')
    })()

    cadence([function (async) {
        async()(new Error('one'))
        async()(new Error('two'))
        async()()
    }, function (errors, error) {
        assert(errors.length, 2, 'got all errors')
        assert(errors[0].message, error.message, 'first error is second argument')
    }])()

    cadence([function (async) {
        async()(null, 1)
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

    cadence([function (async) {
        async()(new Error('handled'))
    }, /handle/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught regex')
    }])()

    cadence([function (async) {
        throw new Error
    }, function (error) {
        return 1
    }], function (number) {
        assert(number, 1, 'handled and value changed')
    })()

    cadence([function (async) {
        var error = new Error('handled')
        error.code = 'ENOENT'
        async()(error)
    }, /ENOENT/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught code regex')
    }])()

    cadence([function (async) {
        async()(new Error('handled'))
    }, 'message', /handle/, function (errors) {
        assert(errors[0].message, 'handled', 'condtionally caught named field regex')
    }])()

    cadence([function (async) {
          async()(new Error('handled'))
    }, 'message', /bogus/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        assert(error.message, 'handled', 'condtionally caught failure')
    })

    cadence([function (async) {
        async()(new Error('handled'))
        async()(new Error('unhandled'))
    }, 'message', /^(handled)$/, function (errors) {
        throw new Error('should not get here')
    }])(function (error) {
        assert(error.message, 'unhandled', 'condtionally caught did not catch all')
    })

    cadence([function (async) {
        async([function () {
            async()(new Error('handled'))
            async()(new Error('unhandled'))
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

    cadence(function (async) {
        async([function () {
            throw new Error
        }, function () {
            return [ async ]
        }], function () {
            throw new Error('branch called')
        })
    })(function (error) {
        assert(!error, 'error was thrown')
    })

    var dirty = true
    try {
        cadence(function (async) {
            async([function () {
                dirty = false
            }], function () {
                async(function () {
                    return [ async ]
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

    return

    // This test worked with Istanbul 0.3.2 and stopped working by Istnabul
    // 0.3.5. Since it seems to be more of an experiement than an acutal
    // software quality test, and because it does not reduce coverage to skip
    // these tests, I'm going to skip these tests. The `domain.js` module still
    // works.

    // It still works, but I never use Domains, so I'm not going to be the one
    // to know what feels right and what feels wrong. It might not be how
    // domains are used. As far as I can tell, they use some of the principles
    // of Cadence, but are more magical, so that Node.js functions wrap their
    // callbacks, the way that Cadence wraps a step.

    var domain = require('domain').create(), wait = async()
    domain.on('error', function (e) {
        assert(!dirty, 'finalizer ran')
        assert(e.message, 'propagated', 'domain propagated')
        wait()
    })
    domain.run(function () {
        cadence(function (async) {
            async([function () {
                dirty = false
            }], function () {
                async(function () {
                    process.nextTick(async())
                }, function () {
                    return [ async ]
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
}))
