var stack = [], JUMP = {}

function Cadence (parent, self, steps, vargs, callback, loop, cadence) {
    this.parent = parent
    this.self = self
    this.finalizers = []
    this.steps = steps
    this.callback = callback
    this.loop = loop
    this.cadence = cadence || this
    this.cadences = []
    this.results = []
    this.errors = []
    this.called = 0
    this.index = 0
    this.sync = true
    this.waiting = false
    this.vargs = vargs
}

// TODO Expand on this. You keep coming back here and saying, oh, no, I need to
// give up on a step if there is an error. I'm not returning from this because
// there is an error and all the callbacks are not returning. I need to return
// immediately if there is an error, and then have a lot more code to deal with
// the stragglers that return.
//
// Go back to your code. Try to explain to me why one error first callback
// function returning an error is preventing another, completely different
// callback function from returning an error. Pretend the are calls to open two
// separate files and tell me why the orderly error reporting of the inability
// to open one file should prevent the completion of the opening of another.
// You're probably doing something complicated, a callback is deferred, and
// neglecting to notify the deferred callback of an error.
//
// In short, this code is fine. If you were not using Cadence either you would
// not have noticed the problem, or else you've have some sort of straggler
// issue causing your code to continue after you've responded to an error.
//
// TODO Update. Yes, good point. This is rare in production code, but I do
// encounter it a lot in testing where I'm testing race conditions in concurrent
// code, the kind of code that Cadence has made it easy for me to write.
//
// Because this is rare in production, it's not all that difficult to accept
// that Cadence should return on the first error, then silently swallow all
// subsequent errors. That seems ugly, but not advancing is also ugly, and in
// both cases the ugliness is avoided by writing code that runs serially.
// (Parallel code using the Node.js event loop is a boondoggle.)
//
// The logic isn't that much more difficult.
//
// It does present challenges when you consider what it means to run finalizers
// early.

//
function createCallback (cadence) {
    var index = cadence.results.length

    cadence.results.push([])
    cadence.sync = false

    return function (error) {
        if (error == null) {
            var I = arguments.length
            var vargs = cadence.results[index]
            for (var i = 1; i < I; i++) {
                vargs[i - 1] = arguments[i]
            }
        } else {
            cadence.errors.push(error)
        }
        if (++cadence.called === cadence.results.length) {
            if (cadence.waiting) {
                invoke(cadence)
            } else {
                cadence.sync = true
            }
        }
    }
}

function invoke (cadence) {
    var vargs, fn
    for (;;) {
        if (cadence.errors.length) { // Critical path.
            cadence.results.length = 0
            // Break on error cadence is frustrated further by catch blocks that
            // would restore forward motion. I suppose you'd only short-circuit
            // cadences subordinate to this cadence.
            if (cadence.catcher) {
                var catcher = cadence.catcher, errors = cadence.errors.splice(0)
                fn = function () {
                    return catcher.call(cadence.self, errors[0], errors)
                }
            } else {
                fn = null
                cadence.loop = false
            }
        } else {
            if (cadence.results.length == 0) { // Critical path.
                // We had no async callbacks, so use the return value.
                vargs = cadence.vargs
                // Check for a loop controller in the return values.
                if (vargs[0] && vargs[0].jump === JUMP) {
                    var jump = vargs.shift()
                    var iterator = cadence
                    // Walk up to the jumping cadence setting all the
                    // sub-cadences along the way to their last step. We
                    // continue with the current cadence, not the destination.
                    // We don't skip finalizers. When we continue, if the
                    // current cadence is not the jumping cadence, we're going
                    // to run the exit procedures for each sub-cadence.
                    if (!jump.immediate) {
                        var destination = jump.cadence || cadence.cadence
                        while (destination !== iterator) {
                            iterator.loop = false
                            iterator.index = iterator.steps.length
                            iterator = iterator.parent
                        }
                    }
                    // Set the index and stop looping if this is a `break`.
                    iterator.index = Math.min(jump.index, iterator.steps.length)
                    iterator.loop = iterator.loop && ! jump.break
                }
            } else {
                // Combine the results of all the callbacks into an single array
                // of arguments that will be used to invoke the next step.
                cadence.vargs = vargs = cadence.results.shift()
                // Neither `vargs.push.apply(vargs, vargs_)` nor `vargs_.shift()` is faster.
                while (cadence.results.length != 0) {
                    var vargs_ = cadence.results.shift()
                    for (var j = 0, J = vargs_.length; j < J; j++) {
                        vargs.push(vargs_[j])
                    }
                }
            }
            // On to the next step.
            fn = cadence.steps[cadence.index++]
        }

        if (fn == null) { // Critical path.
            if (cadence.finalizers.length) {
                // We're going to continue to loop until all the finalizers have
                // executed. The step index is going to go beyond length of the
                // step array, but that's okay.
                var finalizer = cadence.finalizers.pop(), errors = cadence.errors.splice(0)
                fn = function () {
                    async(function () {
                        return finalizer.vargs
                    }, [finalizer.steps[0], function (error) {
                        if (errors.length) throw errors[0]
                        throw error
                    }], function () {
                        if (errors.length) throw errors[0]
                        return vargs
                    })
                }
            } else if (cadence.loop) {
                // Go back to the first step.
                fn = cadence.steps[0]
                cadence.index = 1
            } else if (cadence.errors.length) {
                // Return the first error we received.
                cadence.callback.apply(null, [ cadence.errors[0] ])
                break
            } else {
                if (vargs.length !== 0) {
                    vargs.unshift(null)
                }
                cadence.callback.apply(null, vargs)
                break
            }
        }

        cadence.called = 0
        cadence.sync = true
        cadence.waiting = false
        cadence.catcher = null

        if (Array.isArray(fn)) { // Critical path.
            if (fn.length === 1) {
                cadence.finalizers.push({ steps: fn, vargs: vargs })
                continue
            } else if (fn.length === 2) {
                cadence.catcher = fn[1]
                fn = fn[0]
            } else if (fn.length === 3) {
                var filter = fn
                cadence.catcher = function (error) {
                    if (filter[1].test(error.code || error.message)) {
                        return filter[2].call(cadence, error)
                    } else {
                        throw error
                    }
                }
                fn = fn[0]
            } else {
                cadence.vargs = [ vargs ]
                continue
            }
        }

        stack.push(cadence)

        try {
            var ret = fn.apply(cadence.self, vargs)
            if (ret !== void(0)) {
                cadence.vargs = Array.isArray(ret) ? ret : [ ret ]
            }
            // The only one that could be removed if we where to invoke cadences
            // directly and immediately when created. It would change loop
            // labeling so that the loop label was always passed in as a final
            // argument to the variadic arguments. This would in cause a gotcha
            // where the user needs to make sure that each loop gets the same
            // arguments, ah, and that's surprising because often times we're
            // not thinking about the return at the end.
            while (cadence.cadences.length != 0) {
                invoke(cadence.cadences.shift())
            }
        } catch (error) {
            cadence.errors.push(error)
            cadence.sync = true
        }

        stack.pop()

        if (!cadence.sync) {
            cadence.waiting = true
            break
        }
    }
}

function async () {
    var cadence = stack[stack.length - 1]
    var I = arguments.length
    if (I) {
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        invoke(new Cadence(cadence, cadence.self, vargs, [], createCallback(cadence), false, cadence.cadence))
    } else {
        return createCallback(cadence)
    }
}

async.continue = { jump: JUMP, index: 0, break: false, immediate: false }
async.break = { jump: JUMP, index: Infinity, break: true, immediate: false }
async.return = { jump: JUMP, index: Infinity, break: true, immediate: true }

function variadic (f) {
    return function () {
        var I = arguments.length
        var vargs = new Array
        for (var i = 0; i < I; i++) {
            vargs.push(arguments[i])
        }
        return f(vargs)
    }
}

async.loop = variadic(function (steps) {
    var cadence = stack[stack.length - 1]
    var vargs = steps.shift()
    var looper = new Cadence(cadence, cadence.self, steps, vargs, createCallback(cadence), true, null)
    cadence.cadences.push(looper)
    return {
        continue: { jump: JUMP, index: 0, break: false, cadence: looper, immediate: false },
        break: { jump: JUMP, index: Infinity, break: true, cadence: looper, immediate: false }
    }
})

async.block = variadic(function (steps) {
    steps.unshift([])
    steps.push(variadic(function (vargs) {
        return [ async.break ].concat(vargs)
    }))
    return async.loop.apply(async, steps)
})

async.forEach = variadic(function (steps) {
    var vargs = steps.shift(), array = vargs.shift(), index = -1
    steps.unshift(vargs, variadic(function (vargs) {
        index++
        if (index === array.length) return [ async.break ].concat(vargs)
        return [ array[index], index ].concat(vargs)
    }))
    return async.loop.apply(this, steps)
})

async.map = variadic(function (steps) {
    var vargs = steps.shift(), array = vargs.shift(), index = -1, gather = []
    steps.unshift(vargs, variadic(function (vargs) {
        index++
        if (index === array.length) return [ async.break, gather ]
        return [ array[index], index ].concat(vargs)
    }))
    steps.push(variadic(function (vargs) {
        gather.push.apply(gather, vargs)
    }))
    return async.loop.apply(this, steps)
})

var builders = []

function cadence () {
    var I = arguments.length
    var steps = new Array
    for (var i = 0; i < I; i++) {
        steps.push(arguments[i])
    }
    function execute () {
        var I = arguments.length - 1
        var vargs = new Array(I + 1)
        vargs[0] = async
        for (var i = 0; i < I; i++) {
            vargs[i + 1] = arguments[i]
        }
        invoke(new Cadence(null, this, steps, vargs, arguments[i], false, null))
    }

    // Preserving arity costs next to nothing; the call to `execute` in these
    // functions will be inlined. The airty function itself will never be
    // inlined because it is in a different context than that of our dear user,
    // but it will be compiled.
    //
    // We put back the switch statement that creates a shim without using
    // `new Function` because in doing so we can skip through Cadence using the
    // Chrome debugger's blackbox framework features. If we go through the
    // generated function, we're not able to pattern match the specific file
    // name since it is randomly generated. We could match it, but we'd skip
    // over any generated function, not just the ones generated by Cadence.
    //
    // Obviously, we'll have to step into our shim if it has more arguments then
    // the options in the following switch statement. Note that I'm allowing the
    // builder array to contain builders that will never get called because the
    // switch statement will intercept the request. It keeps the code readable
    // for now.
    var f
    switch (steps[0].length) {
    case 0:
        f = function () { execute.apply(this, arguments) }
        break
    case 1:
        f = function (one) { execute.apply(this, arguments) }
        break
    case 2:
        f = function (one, two) { execute.apply(this, arguments) }
        break
    case 3:
        f = function (one, two, three) { execute.apply(this, arguments) }
        break
    case 4:
        f = function (one, two, three, four) { execute.apply(this, arguments) }
        break
    case 5:
        f = function (one, two, three, four, five) { execute.apply(this, arguments) }
        break
    case 6:
        f = function (one, two, three, four, five, six) { execute.apply(this, arguments) }
        break
    case 7:
        f = function (one, two, three, four, five, six, seven) { execute.apply(this, arguments) }
        break
    case 8:
        f = function (one, two, three, four, five, six, seven, eight) { execute.apply(this, arguments) }
        break
    case 9:
        f = function (one, two, three, four, five, six, seven, eight, nine) { execute.apply(this, arguments) }
        break
    default:
        while (builders.length < steps[0].length + 1) {
            var args = []
            for (var i = 0, I = builders.length; i < I; i++) {
                args[i] = '_' + i
            }
            builders.push(new Function ('                                   \n\
                return function (execute) {                                 \n\
                    return function (' + args.join(',') + ') {              \n\
                        execute.apply(this, arguments)                      \n\
                    }                                                       \n\
                }                                                           \n\
            ')())
        }
        f = builders[steps[0].length](execute)
    }

    f.toString = function () { return steps[0].toString() }

    return f
}

module.exports = cadence
