! function (definition) {
    if (typeof window != "undefined") window.cadence = definition()
    else if (typeof define == "function") define(definition)
    else module.exports = definition()
} (function () {
    // NOTE: You are allowed to say, "behavior is undefined." Cadence in its
    // current incarnation may behave a certain way, but you do not have to
    // document it.
    var __slice = [].slice

    function consume (to, from) {
        to.push.apply(to, from.splice(0, from.length))
    }

    function cadence () {
        var steps = __slice.call(arguments), frames = [], f

        function enframe (self, done, steps, index, caller, callbacks, catcher) {
            return {
                self: self,
                done: done,
                steps: steps,
                index: index,
                nextIndex: index + 1,
                caller: caller,
                catcher: catcher,
                callbacks: callbacks,
                cleanup: [],
                errors: [],
                finalizers: []
            }
        }

        var execute = function (self, vargs) {
            var callback = function (error) { if (error) throw error }

            if (vargs.length) {
                callback = vargs.pop()
            }

            invoke(enframe(self, done, steps, -1, { errors:[], root: true }, argue([ async ].concat(vargs))))

            function done (errors, finalizers, results) {
                var vargs = results.length ? [null].concat(results) : []
                finalize.call(this, finalizers, finalizers.length - 1, errors, function (errors) {
                    if (errors.length) {
                        callback(errors.uncaught || errors.shift())
                    } else {
                        callback.apply(null, vargs)
                    }
                })
            }
        }

        // To use the same `step` function throughout while supporting reentrancy,
        // we keep a stack of frame objects. The stack is reversed; top is 0. The
        // `step` function is synchronous and will return immediately.
        //
        // It is possible for the user to invoke `step` outside of a step in a
        // cadence, we can't prevent it, nor really even detect it. Imagine the user
        // invoking `setTimeout` with a callback that calls `step` five minutes
        // later, long after the cadence has ended. Mayhem, but what can you do?

        // See frames above. fixme: assert that you never have more than one frame.

        function async () {
            return _async(frames[0], { errors: [], results: [] }, __slice.call(arguments))
        }

        function _async (frame, callback, vargs) {
            if (vargs.length) {
                if (vargs[0] === async) {
                    callback.fixup = !! vargs.shift()
                    if (!vargs.length) return function () {
                        return _async(frame, callback, __slice.call(arguments))
                    }
                    throw new Error('relocating')
                }

                if (vargs[0] === Error) {
                    var error = _async(frame, callback, [ 0, [] ].concat(vargs.slice(1)))
                    callback.count = Infinity
                    return function (e) {
                        error()(e)
                    }
                }

                if (vargs[0] === null) {
                    vargs.shift()
                    callback.event = true
                }

                if (vargs[0] && vargs[0].invoke === invoke) {
                    frame.callbacks[0].results.push(vargs.shift())
                }

                if (typeof vargs[0] == 'string') {
                    callback.property = vargs.shift()
                }

                if (!isNaN(parseInt(vargs[0], 10))) {
                    callback.arity = +(vargs.shift())
                }

                if (Array.isArray(vargs[0])) {
                    if (vargs[0].length == 0) {
                        callback.arrayed = !! vargs.shift()
                    } else if (!callback.fixup
                            && vargs.length == 1
                            && vargs[0].length == 1
                            && typeof vargs[0][0] == 'function') {
                        frame.cleanup.push(vargs.shift().shift())
                        return
                    }
                }

                if (vargs.length) {
                    if (typeof vargs[0].async == 'function') {
                        return vargs.shift().async(async, vargs)
                    } else if (typeof vargs[0].then == 'function') {
                        var promise = vargs.shift(), handler = async.apply(frame.self, vargs)
                        return promise.then(function () {
                            handler.apply(null, [null].concat(__slice.call(arguments)))
                        }, handler)
                    }
                }
            }

            frame.callbacks.push(callback)

            callback.steps = vargs

            if (callback.steps.length) {
                if (!callback.fixup) return createCadence(frame, callback)
            }

            if (callback.arrayed) {
                var index = 0
                var arrayed = function () {
                    return createCallback(frame, callback, index++)
                }
                if (callback.event) {
                    return function () {
                        arrayed().apply(null, [ null ].concat(__slice.call(arguments)))
                    }
                } else {
                    return arrayed
                }
            }

            var done = createCallback(frame, callback, 0)
            if (callback.event) {
                return function () {
                    done.apply(null, [ null ].concat(__slice.call(arguments)))
                }
            } else {
                return done
            }
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
                    // Parallel loop.
                    return createCallback(frame, callback, index++).apply(null, [null].concat(vargs))
                } else if (vargs[0] === invoke) {
                    // Start an unstarted plain cadence. A reminder; zero index
                    // because the result is not arrayed.
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
                        if (each = Array.isArray(counter)) {
                            whilst = function () { return count != counter.length }
                        } else {
                            whilst = function () { return count != counter }
                        }
                    }

                    callback.steps.unshift(function () {
                        var vargs = __slice.call(arguments)
                        if (whilst()) {
                            if (counter) {
                                return [].concat(each ? [ counter[count] ] : [], count, vargs)
                            }
                            return vargs.concat(count)
                        } else if (gather) {
                            return [ async ]
                        }
                        return [ async ].concat(vargs)
                    })

                    callback.steps.push(function () {
                        var vargs = __slice.call(arguments)
                        if (gather) {
                            createCallback(frame, subClass(callback, {
                                steps: []
                            }), count).apply(null, [null].concat(vargs))
                        }
                        count++
                        return [ label() ].concat(vargs)
                    })

                    callback.starter = function () {
                        createCallback(frame, callback, 0).apply(null, [null].concat(vargs))
                    }

                    var label = function () {
                        return {
                            invoke: invoke, step: label.step, offset: 0
                        }
                    }

                    label.invoke = invoke
                    label.step = callback.steps[0]
                    label.offset = callback.steps.length

                    return label
                }
            }

            starter.invoke = invoke
            starter.step = callback.steps[0]
            starter.offset = callback.steps.length

            return starter
        }

        function createCallback (frame, callback, index) {
            frame.count++
            function tick () {
                if ((frame.called += callback.count || 1) >= frame.count) {
                    frame.join()
                }
            }
            function register (vargs) {
                var stop = callback.arity == null ? vargs.length : callback.arity
                if (callback.arrayed) {
                    for (var i = 0; i < stop; i++) {
                        if (!callback.results[i]) {
                            callback.results[i] = []
                        }
                        callback.results[i][index] = vargs[i]
                    }
                } else {
                    callback.results = vargs.slice(0, stop)
                    callback.results.length = stop
                }
            }
            return function f () {
                var vargs = __slice.call(arguments), error
                error = vargs.shift()
                if (error) {
                    frame.errors.push(error)
                } else if (callback.steps.length) {
                    frame.count++
                    invoke(enframe(frame.self, done, callback.steps, -1, frame, argue(vargs)))
                    function done (errors, finalizers, results) {
                        consume(frame.errors, errors)

                        if (callback.fixup) {
                            consume(frame.finalizers, finalizers)
                        }

                        finalize.call(frame.self, finalizers, finalizers.length - 1, frame.errors, function () {
                            register(results)
                            tick()
                        })
                    }
                } else {
                    register(vargs)
                }
                tick()
            }
        }

        function subClass (base, override) {
            var object = {}
            for (var key in base) {
                object[key] = base[key]
            }
            for (var key in override) {
                object[key] = override[key]
            }
            return object
        }

        function finalize (finalizers, index, errors, done) {
            if (index == -1) {
                done.call(this, errors)
            } else {
                var finalizer = finalizers[index]
                invoke(enframe(this, function (e) {
                    consume(errors, e)
                    finalize.call(this, finalizers, index - 1, errors, done)
                }, [ finalizer.f ], -1, finalizer.caller, argue(finalizer.vargs)))
            }
        }

        // When we explicitly set we always set the vargs as an array.
        function argue (vargs) { return [{ results: vargs }] }

        function invoke (frame) {
            var f = _invoke(frame)
            while (f) f = f()
        }

        function _invoke (frame) {
            var callbacks = frame.callbacks, vargs = [], arg = 0
            var catcher, finalizers, callback, arity, i, j, k, result, hold, jump
            var steps = frame.steps

            if (frame.errors.length) {
                catcher = frame._catcher
                if (catcher) {
                    invoke(enframe(frame.self, _done, [ catcher ], -1, frame, argue([ frame.errors, frame.errors[0] ]), true))
                    function _done (errors, finalizers, results) {
                        frame.errors = []
                        consume(frame.finalizers, finalizers)
                        if (errors.length) {
                            frame.done.call(frame.self, errors, frame.finalizers, results)
                        } else {
                            frame.callbacks = argue(results)
                            invoke(frame)
                        }
                    }
                } else {
                    frame.done.call(frame.self, frame.errors, frame.finalizers.splice(0, frame.finalizers.length), [])
                }
                return
            }

            var results = callbacks[0].results
            if (frame.cleanup.length) {
                return function () {
                    return _invoke(enframe(frame.self, function (errors, finalizers, results) {
                        consume(frame.errors, errors)
                        consume(frame.finalizers, finalizers)
                        invoke(frame)
                    }, [ frame.cleanup.pop() ], -1, frame, argue([])))
                }
            }

            if (results[0] === async && !frame.caller.root) {
                var iterator = frame.catcher ? frame.caller : frame
                results[0] = {
                    invoke: invoke,
                    step: iterator.steps[0],
                    offset: iterator.steps.length
                }
            }

            if (results[0] && results[0].invoke === invoke) {
                var iterator = frame
                var label = results.shift()
                var finalizers = []
                // fixme: don't stop, have an error.
                while (!iterator.root) {
                    if (iterator.steps[0] === label.step) {
                        iterator.nextIndex = label.offset
                        iterator.callbacks = callbacks
                        callbacks[0].results = results
                        iterator.errors.length = 0
                        consume(iterator.finalizers, finalizers)
                        return function () { return _invoke(iterator) }
                    }
                    consume(finalizers, iterator.finalizers)
                    iterator = iterator.caller
                }
            }


            // One in callbacks means that there were no callbacks created, we're
            // going to use the return value.
            if (callbacks.length == 1) {
                vargs = callbacks[0].results
            } else {
                vargs = callbacks.slice(1).reduce(function (vargs, callback) {
                    var arity = ('arity' in callback) ? callback.arity
                              : Math.max(callback.results.length, callback.arrayed ? 1 : 0)
                    if (callback.arrayed) {
                        for (var i = callback.results.length; i < arity; i++) {
                            callback.results[i] = []
                        }
                    }
                    callback.results.length = arity
                    if (callback.property) {
                        frame.self[callback.property] = callback.results[0]
                    }
                    return vargs.concat(callback.results)
                }, [])
            }

            frame = subClass(frame, {
                cleanup: [],
                _catcher: null,
                callbacks: [],
                errors: [],
                count: 0,
                called: 0,
                index: frame.nextIndex,
                nextIndex: frame.nextIndex + 1,
                sync: false,
                join: function () { frame.sync = true }
            })

            if (steps.length == frame.index) {
                return function () {
                    frame.done.call(frame.self, [], frame.finalizers.splice(0, frame.finalizers.length), vargs)
                }
            }

            var s = frame.steps[frame.index], fn
            if (Array.isArray(s)) {
                if (s.length == 1) {
                    frame.finalizers.push({ f: s[0], vargs: vargs, caller: frame.caller })
                    fn = function () {}
                } else {
                    s = s.slice()
                    fn = s[0]
                    frame._catcher = function (errors, error) {
                        var uncaught = []
                        errors.forEach(function (error) {
                            var caught = true
                            if (s.length == 4) {
                                caught = s[2].test(error[s[1]])
                            } else if (s.length == 3) {
                                var value = error.code || error.message
                                caught = s[1].test(value)
                            }
                            if (!caught && !errors.uncaught) errors.uncaught = error
                            return caught
                        })
                        if (!errors.uncaught) {
                            return s[s.length - 1].call(this, errors, errors[0])
                        } else {
                            throw errors
                        }
                    }
                }
            } else if (typeof s == 'function') {
                fn = s
            } else {
                throw new Error('invalid arguments')
            }

            frames.unshift(frame)

            hold = async()
            var results = frame.callbacks[0].results = [ null ]
            try {
                result = fn.apply(frame.self, vargs)
            } catch (errors) {
                // Caller must always have errors defined or else this condition
                // will be true if the user throws undefined. So, don't save
                // bytes by pruning the errors array from any of the frame
                // initializations.
                if (errors === frame.caller.errors) {
                    frame.errors.uncaught = errors.uncaught
                } else {
                    errors = [ errors ]
                }
                consume(frame.errors, errors)
                frame.called = frame.count - 1
            }
            frame = frames.shift()
            frame.callbacks.forEach(function (callback) {
                if (callback.starter) callback.starter(invoke)
            })
            hold.apply(frame.self, results.concat(result === void(0) ? vargs : result))

            if (frame.sync) {
                return function () { return _invoke(frame) }
            } else {
                frame.join = function () { invoke(frame) }
            }
        }

        // Preserving arity for the sake of Proof. It is expensive in bulk, but
        // it is not expensive in execution time. It does add a stack frame, but
        // the growth is linear. Use of `Function` will freak some people out.
        //
        // This is temporary to see if I can live with it. To see if it blocks
        // anyone's adoption. It is removed if it has to great a cost in
        // performance for some application.
        //
        // This might be important enought to add a switch statement and to say
        // goodbye to a super tiny Cadence. This adds 91 bytes! Okay, added the
        // switch statement for 51 more bytes!
        //
        // So much minified budget to spend on arity. I believe it is the nature
        // of the work that completeness is costly.
        switch (steps[0].length) {
        case 0:
            f = function () {
                execute(this, Array.prototype.slice.call(arguments))
            }
            break
        case 1:
            f = function (one) {
                execute(this, Array.prototype.slice.call(arguments))
            }
            break
        case 2:
            f = function (one, two) {
                execute(this, Array.prototype.slice.call(arguments))
            }
            break
        case 3:
            f = function (one, two, three) {
                execute(this, Array.prototype.slice.call(arguments))
            }
            break
        case 4:
            f = function (one, two, three, four) {
                execute(this, Array.prototype.slice.call(arguments))
            }
            break
        default:
            // Avert your eyes if you're squeamish.
            var args = []
            for (var i = 0; i < steps[0].length; i++) {
                args[i] = '_' + i
            }

            var f = (new Function('execute', 'return function (' + args.join(',') + ') {' +
                'execute(this, Array.prototype.slice.call(arguments))' +
            '}'))(execute)
        }

        f.toString = function () { return steps[0].toString() }

        f.isCadence = true

        return f
    }

    return cadence
})
