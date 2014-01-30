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
            precede({ master: master }, [step].concat(vargs)),
        function (errors, finalizers) {
            var vargs = (arguments.length > 2) ? [null].concat(__slice.call(arguments, 2)) : []
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
    // we keep a stack of frame objects. The stack is reversed; top is 0. The
    // `step` function is synchronous and will return immediately.
    //
    // It is possible for the user to invoke `step` outside of a step in a
    // cadence, we can't prevent it, nor really even detect it. Imagine the user
    // invoking `setTimeout` with a callback that calls `step` five minutes
    // later, long after the cadence has ended. Mayhem, but what can you do?

    //
    var frames = []

    function step () { return createHandler(false, __slice.call(arguments)) }

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

        // The caller as invoked the step function directly as an explicit early
        // return to exit the entire cadence.
        //
        // The rediculous callback count means that as callbacks complete, they
        // never trigger the next step.
        //
        // We callback explicitly to whoever called `invoke`, wait for our
        // parallel operations to end, but ignore their results.
        if (vargs[0] === null || vargs[0] instanceof Error) {
            vargs[0] = vargs[0] ? [ vargs[0] ] : []
            vargs.splice(1, 0, frames[0].finalizers.splice(0, frames[0].finalizers.length))
            frames[0].count = -Number.MAX_VALUE
            frames[0].denouement.apply(null, vargs)
            return
        }

        if (vargs[0] === Error) {
          return createHandler(true, [ 0, [] ].concat(vargs.slice(1)))
        }

        if (vargs[0] instanceof Label) {
            var frame = frames[0]
            var label = vargs.shift()
            while (frame.args) {
                if (frame.args[0].steps[0] === label.step) {
                    frame.args[1] = 1
                    frame.args[2].callbacks = frames[0].callbacks
                    if (!vargs.length) return true
                    return createHandler(false, vargs)
                }
                frame.args[1] = frame.args[0].steps.length
                frame = frame.caller
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
        if (callback.fixup = (vargs[0] === step)) {
            vargs.shift()
        }

        if (typeof vargs[0] == 'boolean') {
            callback.truthiness = vargs.shift()
        }

        if (typeof vargs[0] == 'string') {
            callback.property = vargs.shift()
        }

        if (!isNaN(parseInt(vargs[0], 10))) {
            callback.arity = +(vargs.shift())
        }

        if (Array.isArray(vargs[0]) && vargs[0].length == 0) {
            callback.arrayed = !! vargs.shift()
        }

        frames[0].callbacks.push(callback)

        unfold(vargs) // for the sake of error checking
        callback.steps = vargs

        if (callback.steps.length) {
            if (!callback.fixup) return createCadence(frames[0], callback)
        }

        if (callback.arrayed) {
            if (event) return createCallback(frames[0], callback, -1)
            else return createArray(frames[0], callback)
        }

        return createCallback(frames[0], callback, 0)
    }

    function Label (step) {
        this.step = step
    }

    function createCadence (frame, callback) {
        var index = 0

        if (!callback.arrayed) callback.starter = starter

        function starter () {
            var vargs = __slice.call(arguments)
            var count = 0
            var prefix, gather, counter
            var whilst, each, first

            if (callback.arrayed) {
                return createCallback(frame, callback, index++).apply(null, [null].concat(vargs))
            } else if (vargs[0] === invoke) {
                // A reminder; zero index because the result is not arrayed.
                createCallback(frame, callback, 0).call(null)
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
                        step().apply(this, [null].concat(each ? [counter[count]] : vargs).concat([count]))
                    } else if (gather) {
                        step.apply(this, [null].concat(vargs))
                        callback.results = gather
                    } else {
                        step.apply(this, [null].concat(vargs))
                    }
                })

                callback.steps.push(function () {
                    var vargs = __slice.call(arguments)
                    if (gather) gather.push(vargs)
                    frames[0].args[1] = 0
                    step().apply(this, [null].concat(vargs))
                    count++
                })

                callback.starter = function () {
                    createCallback(frame, callback, 0).apply(null, [null].concat(vargs))
                }

                return new Label(callback.steps[0])
            }
        }

        return starter
    }

    function createArray (frame, callback) {
        var index = 0
        return function () {
            var vargs = __slice.call(arguments)
            return createCallback(frame, callback, index++)
        }
    }

    function createCallback (frame, callback, index) {
        if (-1 < index) frame.count++
        return function () {
            var vargs = __slice.call(arguments, 0), error
            error = vargs.shift()
            if (error) {
                frame.errors.push(error)
            } else {
                if (index < 0) callback.results.push(vargs)
                else callback.results[index] = vargs
                if (callback.steps.length) {
                  frame.count++
                  invoke.call(frame.self, unfold(callback.steps), 0, precede(frame, callback.results[index]), function (errors, finalizers) {
                      callback.results[index] = __slice.call(arguments, 2) // TODO: use argue
                      __push.apply(frame.errors, errors)

                      if (callback.fixup) {
                          __push.apply(frame.finalizers, finalizers)
                          denouement()
                      } else {
                          finalize.call(this, finalizers, 0, frame.errors, denouement)
                      }

                      function denouement () {
                          if (-1 < index && ++frame.called == frame.count) {
                              invoke.apply(frame.self, frame.args)
                          }
                      }
                  })
                }
                if (vargs[0] === invoke) {
                    frame.callbacks.forEach(function (callback) {
                        if (callback.starter) callback.starter(invoke)
                    })
                }
            }
            if (index < 0 ? frame.errors.length : ++frame.called == frame.count) {
                invoke.apply(frame.self, frame.args)
            }
        }
    }

    function finalize (finalizers, index, errors, denouement) {
        if (index == finalizers.length) {
            denouement.call(this, errors)
        } else {
            var finalizer = finalizers[index]
            invoke.call(this, unfold([ finalizer.step ]), 0, finalizer.previous, function (e) {
                __push.apply(errors, e)
                finalize.call(this, finalizers, index + 1, errors, denouement)
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

    function invoke (cadence, index, previous, denouement) {
        var callbacks = previous.callbacks
        var catcher, finalizers, errors
        var callback, arity, vargs = [], arg = 0, i, j, k
        var result, hold, terminate

        if (previous.errors.length) {
            catcher = cadence.catchers[index - 1]
            if (catcher) {
                invoke.call(previous.self, unfold([ catcher ]), 0, precede(previous, [ previous.errors, previous.errors[0] ]), function (errors, finalizers) {
                  previous.errors = []
                  __push.apply(previous.finalizers, finalizers)
                  if (errors.length) {
                      arguments[1] = previous.finalizers
                      denouement.apply(this, __slice.call(arguments))
                  } else {
                      previous.callbacks = argue(__slice.call(arguments, 2))
                      invoke.apply(previous.self, previous.args)
                  }
                })
            } else {
                denouement.call(this, previous.errors, previous.finalizers.splice(0, previous.finalizers.length))
            }
            return
        }

        if (callbacks.length == 1) {
            i = 0, j = 1
        } else {
            i = 1, j = 0
        }

        for (; i < callbacks.length; i++) {
            callback = callbacks[i]
            if (callback.arrayed) {
                callback.results = callback.results.filter(function (vargs) { return vargs.length })
            }
            if ('arity' in callback) {
                arity = callback.arity
            } else {
                arity = callback.arrayed ? 1 : 0
                callback.results.forEach(function (result) {
                    arity = Math.max(arity, result.length - j)
                })
            }
            for (k = 0; k < arity; k++) {
                vargs.push({ values: [], arrayed: callback.arrayed })
            }
            callback.results.forEach(function (result) {
                for (k = 0; k < arity; k++) {
                    vargs[arg + k].values.push(result[k + j])
                }
            })
            if ('truthiness' in callback) {
                if (terminate == null) terminate = false
                if (!terminate) {
                    terminate = !!(callback.results.length && callback.results[0][0]) === !!(callback.truthiness)
                }
            }
            if (callback.property) {
                this[callback.property] = vargs[0].arrayed ? vargs[0].values : vargs[0].values[0]
            }
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

        if (cadence.steps.length == index || terminate) { // FIXME: can't be right, we're using MAX_VALUE above.
            var finalizers = previous.finalizers.splice(0, previous.finalizers.length)
            denouement.apply(this, [ [], finalizers ].concat(vargs))
            return
        }

        frames.unshift({
            self: this,
            callbacks: [],
            count: 0,
            called: 0,
            errors: [],
            finalizers: previous.finalizers,
            master: previous.master,
            denouement: denouement,
            caller: previous.caller
        })
        frames[0].args = [ cadence, index + 1, frames[0], denouement ]

        hold = step()
        try {
            result = cadence.steps[index].apply(this, vargs)
        } catch (errors) {
            if (frames[0].master.completed) throw errors
            if (errors === previous.caller.errors) {
                frames[0].errors.uncaught = errors.uncaught
            } else {
                errors = [ errors ]
            }
            __push.apply(frames[0].errors, errors)
            frames[0].called = frames[0].count - 1
        }
        frames.shift()
        hold.apply(this, [ null, invoke ].concat(result === void(0) ? [] : [ result ]))
    }

    return execute
}

module.exports = cadence
