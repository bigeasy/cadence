var __slice = [].slice
var __push = [].push

function cadence () {
    var steps = __slice.call(arguments)

    function execute () {
        var vargs = __slice.call(arguments, 0)
        var callback = function (error) { if (error) throw error }
        var master = {}
        if (vargs.length) {
            callback = vargs.pop()
        }
        invoke.call(
            this, unfold(steps), 0,
            precede({ master: master }, [async].concat(vargs)),
        function (errors, finalizers) {
            var vargs = [null].concat(__slice.call(arguments, 2))
            finalize.call(this, finalizers, 0, errors, function (errors) {
                master.completed = true
                if (errors.length) {
                    callback(errors.uncaught || errors.shift())
                } else {
                    callback.apply(null, vargs)
                }
            })
        })
    }

    // To use the same `step` function throughout while supporting reentrancy,
    // we keep a stack of invocation objects. The stack is reversed; top is 0.
    // The `step` function is synchronous and will return immediately.
    //
    // It is possible for the user to invoke `step` outside of a step in a
    // cadence, we can't prevent it, nor really even detect it. Imagine the user
    // invoking `setTimeout` with a callback that calls `step` five minutes
    // later, long after the cadence has ended. Mayhem, but what can you do?

    //
    var invocations = []

    function async () { return createHandler(false, __slice.call(arguments)) }

    function unfold (steps) {
        var cadence = {
            catchers: [],
            steps: [],
        // TODO: DOCUMENT: Only one finalizer after each step. You cannot have two
        // consecutive finalizers.
            finalizers: []
        }
        steps.forEach(function (step) {
            if (Array.isArray(step)) {
                if (step.length == 1) {
                    cadence.finalizers[cadence.steps.length] = { step: step[0] }
                } else {
                    cadence.steps.push(step[0])
                    cadence.catchers[cadence.steps.length - 1] = function (errors, error) {
                        var uncaught = []
                        errors.forEach(function (error) {
                            var caught = true
                            if (step.length == 4) {
                                caught = step[2].test(error[step[1]])
                            } else if (step.length == 3) {
                                var value = error.code || error.message
                                caught = step[1].test(value)
                            }
                            if (!caught && !errors.uncaught) errors.uncaught = error
                            return caught
                        })
                        if (!errors.uncaught) {
                            return step[step.length - 1].call(this, errors, errors[0])
                        } else {
                            throw errors
                        }
                    }
                }
            } else if (typeof step == 'function') {
                cadence.steps.push(step)
            } else {
                throw new Error('invalid arguments')
            }
        })
        return cadence
    }

    function createHandler (event, vargs) {
        var i = -1

        // The caller as invoked the async function directly as an explicit early
        // return to exit the entire cadence.
        //
        // The rediculous callback count means that as callbacks complete, they
        // never trigger the next step.
        //
        // We callback explicitly to whoever called `invoke`, wait for our
        // parallel operations to end, but ignore their results.
        if (vargs[0] === null || vargs[0] instanceof Error) {
            vargs[0] = vargs[0] ? [ vargs[0] ] : []
            vargs.splice(1, 0, invocations[0].finalizers.splice(0, invocations[0].finalizers.length))
            invocations[0].count = -Number.MAX_VALUE
            invocations[0].callback.apply(null, vargs)
            return
        }

        if (vargs[0] === Error) {
          return createHandler(true, [ 0, [] ].concat(vargs.slice(1)))
        }

        if (vargs[0] instanceof Label) {
            var invocation = invocations[0]
            var label = vargs.shift()
            while (invocation.args) {
                if (invocation.args[0].steps[0] === label.step) {
                    invocation.args[1] = 1
                    invocation.args[2].callbacks = invocations[0].callbacks
                    if (!vargs.length) return true
                    return createHandler(false, vargs)
                }
                invocation.args[1] = invocation.args[0].steps.length
                invocation = invocation.caller
            }
        }

        if (vargs[0] === -1) {
          var callback = createHandler(true, vargs.slice(1))
          return function () {
              return callback.apply(null, [ null ].concat(__slice.call(arguments)))
          }
        }

        // TODO Callback can be empty.
        var callback = { errors: [], results: [] }
        if (callback.fixup = (vargs[0] === async)) {
            vargs.shift()
        }

        if (!isNaN(parseInt(vargs[0], 10))) {
            callback.arity = +(vargs.shift())
        }

        if (Array.isArray(vargs[0]) && vargs[0].length == 0) {
            callback.arrayed = !! vargs.shift()
        }

        invocations[0].callbacks.push(callback)

        unfold(vargs) // for the sake of error checking
        callback.steps = vargs

        if (callback.steps.length) {
            if (!callback.fixup) return createCadence(invocations[0], callback)
        }

        if (callback.arrayed) {
            if (event) return createCallback(invocations[0], callback, -1)
            else return createArray(invocations[0], callback)
        }

        return createCallback(invocations[0], callback, 0)
    }

    function Label (step) {
        this.step = step
    }

    function createCadence (invocation, callback) {
        var index = 0

        if (!callback.arrayed) callback.starter = starter

        function starter () {
            var vargs = __slice.call(arguments)
            var count = 0
            var prefix, gather, counter
            var whilst, each, first

            if (callback.arrayed) {
                return createCallback(invocation, callback, index++).apply(null, [null].concat(vargs))
            } else if (vargs[0] === invoke) {
                // A reminder; zero index because the result is not arrayed.
                createCallback(invocation, callback, 0).call(null)
            } else {
                delete callback.starter

                whilst = function () { return true }
                if (vargs[0] == null) {
                    vargs.shift()
                } else {
                    if (Array.isArray(vargs[0]) && vargs.length > 1) {
                        gather = []
                        callback.arrayed = true
                        vargs.shift()
                    }
                     counter = vargs.shift()
                    if (typeof counter == 'number') {
                        whilst = function () { return count != counter }
                    } else if (each = Array.isArray(counter)) {
                        whilst = function () { return count != counter.length }
                    } else {
                        throw new Error('invalid arguments')
                    }
                }

                callback.steps.unshift(function () {
                    var vargs = __slice.call(arguments)
                    if (whilst()) {
                        async().apply(this, [null].concat(each ? [counter[count]] : vargs).concat([count]))
                    } else if (gather) {
                        async.apply(this, [null].concat(vargs))
                        callback.results = gather
                    } else {
                        async.apply(this, [null].concat(vargs))
                    }
                })

                callback.steps.push(function () {
                    var vargs = __slice.call(arguments)
                    if (gather) gather.push(vargs)
                    invocations[0].args[1] = 0
                    async().apply(this, [null].concat(vargs))
                    count++
                })

                callback.starter = function () {
                    createCallback(invocation, callback, 0).apply(null, [null].concat(vargs))
                }

                return new Label(callback.steps[0])
            }
        }

        return starter
    }

    function createArray (invocation, callback) {
        var index = 0
        return function () {
            var vargs = __slice.call(arguments)
            return createCallback(invocation, callback, index++)
        }
    }

    function createCallback (invocation, callback, index) {
        if (-1 < index) invocation.count++
        return function () {
            var vargs = __slice.call(arguments, 0), error
            error = vargs.shift()
            if (error) {
                invocation.errors.push(error)
            } else {
                if (index < 0) callback.results.push(vargs)
                else callback.results[index] = vargs
                if (callback.steps.length) {
                  invocation.count++
                  invoke.call(invocation.self, unfold(callback.steps), 0, precede(invocation, callback.results[index]), function (errors, finalizers) {
                      callback.results[index] = __slice.call(arguments, 2) // TODO: use argue
                      __push.apply(invocation.errors, errors)

                      if (callback.fixup) {
                          __push.apply(invocation.finalizers, finalizers)
                          done()
                      } else {
                          finalize.call(this, finalizers, 0, invocation.errors, done)
                      }

                      function done () {
                          if (-1 < index && ++invocation.called == invocation.count) {
                              invoke.apply(invocation.self, invocation.args)
                          }
                      }
                  })
                }
                if (vargs[0] === invoke) {
                    invocation.callbacks.forEach(function (callback) {
                        if (callback.starter) callback.starter(invoke)
                    })
                }
            }
            if (index < 0 ? invocation.errors.length : ++invocation.called == invocation.count) {
                invoke.apply(invocation.self, invocation.args)
            }
        }
    }

    function finalize (finalizers, index, errors, callback) {
        if (index == finalizers.length) {
            callback.call(this, errors)
        } else {
            var finalizer = finalizers[index]
            invoke.call(this, unfold([ finalizer.step ]), 0, finalizer.previous, function (e) {
                __push.apply(errors, e)
                finalize.call(this, finalizers, index + 1, errors, callback)
            })
        }
    }

    function precede (caller, vargs) {
        return {
            caller: caller,
            master: caller.master,
            callbacks: argue(vargs),
            errors: [],
            finalizers: []
        }
    }

    function argue (vargs) { return [{ results: [[invoke].concat(vargs)] }] }

    function invoke (cadence, index, previous, callback) {
        var callbacks = previous.callbacks
        var catcher, finalizers, errors
        var cb, arity, vargs = [], arg = 0, i, j, k
        var step, result, hold

        if (previous.errors.length) {
            catcher = cadence.catchers[index - 1]
            if (catcher) {
                invoke.call(previous.self, unfold([ catcher ]), 0, precede(previous, [ previous.errors, previous.errors[0] ]), function (errors, finalizers) {
                  previous.errors = []
                  __push.apply(previous.finalizers, finalizers)
                  if (errors.length) {
                      arguments[1] = previous.finalizers
                      callback.apply(this, __slice.call(arguments))
                  } else {
                      previous.callbacks = argue(__slice.call(arguments, 2))
                      invoke.apply(previous.self, previous.args)
                  }
                })
            } else {
                callback.call(this, previous.errors, previous.finalizers.splice(0, previous.finalizers.length))
            }
            return
        }

        if (callbacks.length == 1) {
            i = 0, j = 1
        } else {
            i = 1, j = 0
        }

        for (; i < callbacks.length; i++) {
            cb = callbacks[i]
            if (cb.arrayed) {
                cb.results = cb.results.filter(function (vargs) { return vargs.length })
            }
            if ('arity' in cb) {
                arity = cb.arity
            } else {
                arity = cb.arrayed ? 1 : 0
                cb.results.forEach(function (result) {
                    arity = Math.max(arity, result.length - j)
                })
            }
            for (k = 0; k < arity; k++) {
                vargs.push({ values: [], arrayed: cb.arrayed })
            }
            cb.results.forEach(function (result) {
                for (k = 0; k < arity; k++) {
                    vargs[arg + k].values.push(result[k + j])
                }
            })
            arg += arity
            j = 0
        }

        vargs = vargs.map(function (vargs) {
            return vargs.arrayed ? vargs.values : vargs.values.shift()
        })

        if (cadence.finalizers[index]) {
            previous.finalizers.push(cadence.finalizers[index])
            cadence.finalizers[index].previous = previous
            cadence.finalizers[index].previous.callbacks = argue(vargs)
        }

        if (cadence.steps.length == index) { // FIXME: can't be right, we're using MAX_VALUE above.
            var finalizers = previous.finalizers.splice(0, previous.finalizers.length)
            callback.apply(this, [ [], finalizers ].concat(vargs))
            return
        }

        invocations.unshift({
            self: this,
            callbacks: [],
            count: 0,
            called: 0,
            errors: [],
            finalizers: previous.finalizers,
            master: previous.master,
            callback: callback,
            caller: previous.caller
        })
        invocations[0].args = [ cadence, index + 1, invocations[0], callback ]

        hold = async()
        try {
            result = cadence.steps[index].apply(this, vargs)
        } catch (errors) {
            if (invocations[0].master.completed) throw errors
            if (errors === previous.caller.errors) {
                invocations[0].errors.uncaught = errors.uncaught
            } else {
                errors = [ errors ]
            }
            __push.apply(invocations[0].errors, errors)
            invocations[0].called = invocations[0].count - 1
        }
        invocations.shift()
        hold.apply(this, [ null, invoke ].concat(result === void(0) ? [] : [ result ]))
    }

    return execute
}

module.exports = cadence
