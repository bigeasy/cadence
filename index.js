! function (definition) {
    if (typeof window != "undefined") window.cadence = definition()
    else if (typeof define == "function") define(definition)
    else module.exports = definition()
} (function () {
    var __slice = [].slice

    function consume (to, from) {
        to.push.apply(to, from.splice(0, from.length))
    }

    function cadence () {
        var steps = __slice.call(arguments)

        function enframe (self, consumer, steps, index, caller, callbacks, catcher) {
            return {
                self: self,
                consumer: consumer,
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

        function execute () {
            var vargs = __slice.call(arguments, 0),
                callback = function (error) { if (error) throw error }

            if (vargs.length) {
                callback = vargs.pop()
            }

            invoke(enframe(this, consumer, steps, -1, { root: true }, argue([ step ].concat(vargs))))

            function consumer (errors, finalizers, results) {
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

        //
        var frames = []

        function step () {
            return _step(frames[0], { errors: [], results: [] }, false, __slice.call(arguments))
        }

        function _step (frame, callback, event, vargs) {
            if (vargs.length) {
                if (vargs[0] === step) {
                    callback.fixup = !! vargs.shift()
                    if (!vargs.length) return function () {
                        return _step(frame, callback, false, __slice.call(arguments))
                    }
                    throw new Error('relocating')
                }

                if (vargs[0] === Error) {
                    var error = _step(frame, callback, false, [ 0, [] ].concat(vargs.slice(1)))
                    callback.count = Infinity
                    return function (e) {
                        console.log(e)
                        error()(e)
                    }
                }

                if (vargs[0] === null) {
                    vargs.shift()
                    event = true
                    /*
                    var callback = _step(frame, callback, true, vargs.slice(1))
                    return function () {
                        return callback.apply(null, [ null ].concat(__slice.call(arguments)))
                    }*/
                }

                if (vargs[0] && vargs[0].invoke === invoke) {
                    frame.callbacks[0].results[0].push(vargs.shift())
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
                    if (typeof vargs[0].step == 'function') {
                        return vargs.shift().step(step, vargs)
                    } else if (typeof vargs[0].then == 'function') {
                        var promise = vargs.shift(), handler = step.apply(frame.self, vargs)
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
                var arrayed = createArray(frame, callback)
                if (event) {
                    return function () {
                        arrayed().apply(null, [ null ].concat(__slice.call(arguments)))
                    }
                } else {
                    return arrayed
                }
            }

            var done = createCallback(frame, callback, 0)
            if (event) {
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
                            if (counter) {
                                step().apply(frame.self, [ null ].concat(each ? [ counter[count] ] : [], count, vargs))
                            } else {
                                step().apply(frame.self, [ null ].concat(vargs).concat(count))
                            }
                        } else if (gather) {
                            callback.results = [ null ].concat(gather)
                            return [ step ]
                        } else {
                            return [ step ].concat(vargs)
                        }
                    })

                    callback.steps.push(function () {
                        var vargs = __slice.call(arguments)
                        if (gather) gather.push(vargs)
                        frames[0].nextIndex = 0 // <- why is this not `frame`?
                                                //    ! because we are hacking a step.
                        step().apply(frame.self, [null].concat(vargs))
                        count++
                    })

                    callback.starter = function () {
                        createCallback(frame, callback, 0).apply(null, [null].concat(vargs))
                    }

                    var label = function () {
                        label.offset = 0
                        return label
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

        function createArray (frame, callback) {
            var index = 0
            return function () {
                return createCallback(frame, callback, index++)
            }
        }

        function createCallback (frame, callback, index) {
            frame.count++
            return function () {
                var vargs = __slice.call(arguments, 0), error
                error = vargs.shift()
                if (error) {
                    frame.errors.push(error)
                } else {
                    callback.results[index] = vargs
                    if (callback.steps.length) {
                        frame.count++
                        invoke(enframe(frame.self, consumer, callback.steps, -1, frame, argue(callback.results[index])))
                        function consumer (errors, finalizers, results) {
                            callback.results[index] = results
                            consume(frame.errors, errors)

                            if (callback.fixup) {
                                consume(frame.finalizers, finalizers)
                                consumer()
                            } else {
                                finalize.call(frame.self, finalizers, finalizers.length - 1, frame.errors, consumer)
                            }

                            function consumer () {
                                if (-1 < index && ++frame.called == frame.count) {
                                    invoke(frame)
                            //        frame.join()
                                }
                            }
                        }
                    }
                }
                if ((frame.called += callback.count || 1) >= frame.count) {
                    frame.join()
                }
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

        function finalize (finalizers, index, errors, consumer) {
            if (index == -1) {
                consumer.call(this, errors)
            } else {
                var finalizer = finalizers[index]
                invoke(enframe(this, function (e) {
                    consume(errors, e)
                    finalize.call(this, finalizers, index - 1, errors, consumer)
                }, [ finalizer.f ], -1, finalizer.caller, argue(finalizer.vargs)))
            }
        }

        // When we explicitly set we always set the vargs as an array.
        function argue (vargs) { return [{ results: [[vargs]] }] }

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
                    invoke(enframe(frame.self, _consumer, [ catcher ], -1, frame, argue([ frame.errors, frame.errors[0] ]), true))
                    function _consumer (errors, finalizers, results) {
                        frame.errors = []
                        consume(frame.finalizers, finalizers)
                        if (errors.length) {
                            frame.consumer.call(frame.self, errors, frame.finalizers, results)
                        } else {
                            frame.callbacks = argue(results)
                            invoke(frame)
                        }
                    }
                } else {
                    frame.consumer.call(frame.self, frame.errors, frame.finalizers.splice(0, frame.finalizers.length), [])
                }
                return
            }

            if (frame.cleanup.length) {
                return function () {
                    return _invoke(enframe(frame.self, function (errors, finalizers, results) {
                        consume(frame.errors, errors)
                        consume(frame.finalizers, finalizers)
                        invoke(frame)
                    }, [ frame.cleanup.pop() ], -1, frame, argue([])))
                }
            }

            var results = callbacks[0].results[0]
            if (results.length == 1 && Array.isArray(results[0])) {
                callbacks[0].results[0] = results = results[0]
            }

            if (results[0] === step && !frame.caller.root) {
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
                // fixme: what about finalizers? are they run? probably not.
                while (!iterator.root) {
                    if (iterator.steps[0] === label.step) {
                        iterator.nextIndex = label.offset
                        iterator.callbacks = callbacks
                        callbacks[0].results[0] = [ results ]
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
                i = 0, j = 0
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
                if (callback.property) {
                    frame.self[callback.property] = vargs[0].arrayed ? vargs[0].values : vargs[0].values[0]
                }
                arg += arity
                j = 0
            }

            vargs = vargs.map(function (vargs) {
                return vargs.arrayed ? vargs.values : vargs.values.shift()
            })

            frame = subClass(frame, {
                cleanup: [],
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
                    frame.consumer.call(frame.self, [], frame.finalizers.splice(0, frame.finalizers.length), vargs)
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

            hold = step()
            var results = frame.callbacks[0].results[0] = [ null ]
            try {
                result = fn.apply(frame.self, vargs)
            } catch (errors) {
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
            hold.apply(frame.self, results.concat([ result === void(0) ? vargs : result ]))

            if (frame.sync) {
                return function () { return _invoke(frame) }
            } else {
                frame.join = function () { invoke(frame) }
            }
        }

        return execute
    }

    return cadence
})
