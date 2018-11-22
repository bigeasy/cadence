var stack = [], push = [].push, JUMP = {}

function Cadence (parent, self, steps, vargs, callback, outer) {
    this.parent = parent
    this.finalizers = []
    this.self = self
    this.steps = steps
    this.callback = callback
    this.loop = false
    this.cadence = outer || this
    this.outer = outer
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

Cadence.prototype.resolveCallback = function (result, error, vargs) {
    if (error == null) {
        result.vargs = vargs
    } else {
        this.errors.push(error)
    }
    if (++this.called === this.results.length) {
        if (this.waiting) {
            this.invoke()
        } else {
            this.sync = true
        }
    }
}

Cadence.prototype.createCallback = function () {
    var self = this
    var result = { vargs: [] }

    self.results.push(result)
    self.sync = false

    return callback

    function callback (error) {
        var I = arguments.length
        var vargs = new Array
        for (var i = 1; i < I; i++) {
            vargs[i - 1] = arguments[i]
        }
        self.resolveCallback(result, error, vargs)
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
        cadence.cadences.push(new Cadence(cadence, cadence.self, vargs, [], cadence.createCallback(), cadence.outer))
    } else {
        return cadence.createCallback()
    }
}

async.continue = { jump: JUMP, index: 0, break: false }
async.break = { jump: JUMP, index: Infinity, break: true }

function call (fn, self, vargs) {
    try {
        var ret = fn.apply(self, vargs)
    } catch (e) {
        return [ ret, e ]
    }
    return [ ret ]
}

Cadence.prototype.invoke = function () {
    var vargs, fn
    for (;;) {
        if (this.errors.length) {
            // Break on error cadence is frustrated further by catch blocks that
            // would restore forward motion. I suppose you'd only short-circuit
            // cadences subordinate to this cadence.
            if (this.catcher) {
                var catcher = this.catcher, errors = this.errors
                fn = function () {
                    return catcher.call(this, errors[0], errors)
                }
            } else {
                fn = null
                this.loop = false
            }
        } else {
            if (this.results.length == 0) {
                // We had no async callbacks, so use the return value.
                vargs = this.vargs
                // Check for a loop controller in the return values.
                if (vargs[0] && vargs[0].jump === JUMP) {
                    var jump = vargs.shift()
                    // Walk up to the jumping cadence setting all the
                    // sub-cadences along the way to their last step. We
                    // continue with the current cadence, not the destination.
                    // We don't skip finalizers. When we continue, if the
                    // current cadence is not the jumping cadence, we're going
                    // to run the exit procedures for each sub-cadence.
                    var destination = jump.cadence || this.cadence
                    var iterator = this
                    while (destination !== iterator) {
                        iterator.loop = false
                        iterator.index = iterator.steps.length
                        iterator = iterator.parent
                    }
                    // Set the index and stop looping if this is a `break`.
                    iterator.index = Math.min(jump.index, iterator.steps.length)
                    iterator.loop = iterator.loop && ! jump.break
                }
            } else {
                // Combine the results of all the callbacks into an single array
                // of arguments that will be used to invoke the next step.
                this.vargs = vargs = this.results[0].vargs
                for (var i = 1, I = this.results.length; i < I; i++) {
                    var vargs_ = this.results[i].vargs
                    for (var j = 0, J = vargs_.length; j < J; j++) {
                        vargs.push(vargs_[j])
                    }
                }
            }
            // On to the next step.
            fn = this.steps[this.index++]
        }

        if (fn == null) {
            if (this.finalizers.length) {
                // We're going to continue to loop until all the finalizers have
                // executed. The step index is going to go beyond length of the
                // step array, but that's okay.
                var finalizer = this.finalizers.pop(), errors = this.errors
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
            } else if (this.loop) {
                // Go back to the first step.
                fn = this.steps[0]
                this.index = 1
            } else if (this.errors.length) {
                // Return the first error we received.
                (this.callback).apply(null, [ this.errors[0] ])
                break
            } else {
                if (vargs.length !== 0) {
                    vargs.unshift(null)
                }
                (this.callback).apply(null, vargs)
                break
            }
        }

        this.called = 0
        this.cadences = []
        this.results = []
        this.errors = []
        this.sync = true
        this.waiting = false
        this.catcher = null

        if (Array.isArray(fn)) {
            if (fn.length === 1) {
                this.finalizers.push({ steps: fn, vargs: vargs })
                continue
            } else if (fn.length === 2) {
                this.catcher = fn[1]
                fn = fn[0]
            } else if (fn.length === 3) {
                var filter = fn
                this.catcher = function (error) {
                    if (filter[1].test(error.code || error.message)) {
                        return filter[2].call(this, error)
                    } else {
                        throw error
                    }
                }
                fn = fn[0]
            } else {
                this.vargs = [ vargs ]
                continue
            }
        }

        stack.push(this)

        var ret = call(fn, this.self, vargs)
               // ^^^^

        stack.pop()

        if (ret.length === 2) {
            this.errors.push(ret[1])
            this.vargs = vargs
            this.sync = true
        } else {
            for (var i = 0, I = this.cadences.length; i < I; i++) {
                this.cadences[i].invoke()
            }
            if (ret[0] !== void(0)) {
                this.vargs = Array.isArray(ret[0]) ? ret[0] : [ ret[0] ]
            }
        }

        if (!this.sync) {
            this.waiting = true
            break
        }
    }
}

function execute (self, steps, vargs, callback) {
    new Cadence(null, self, steps, vargs, callback).invoke()
}

function cadence () {
    var I = arguments.length
    var steps = new Array
    for (var i = 0; i < I; i++) {
        steps.push(arguments[i])
    }
    var f
    // Preserving arity costs next to nothing; the call to `execute` in
    // these functions will be inlined. The airty function itself will never
    // be inlined because it is in a different context than that of our
    // dear user, but it will be compiled.
    switch (steps[0].length) {
    case 0:
        f = function () {
            var I = arguments.length - 1
            var vargs = new Array(I + 1)
            vargs[0] = async
            for (var i = 0; i < I; i++) {
                vargs[i + 1] = arguments[i]
            }
            execute(this, steps, vargs, arguments[i])
        }
        break
    case 1:
        f = function (one) {
            var I = arguments.length - 1
            var vargs = new Array(I + 1)
            vargs[0] = async
            for (var i = 0; i < I; i++) {
                vargs[i + 1] = arguments[i]
            }
            execute(this, steps, vargs, arguments[i])
        }
        break
    case 2:
        f = function (one, two) {
            var I = arguments.length - 1
            var vargs = new Array(I + 1)
            vargs[0] = async
            for (var i = 0; i < I; i++) {
                vargs[i + 1] = arguments[i]
            }
            execute(this, steps, vargs, arguments[i])
        }
        break
    case 3:
        f = function (one, two, three) {
            var I = arguments.length - 1
            var vargs = new Array(I + 1)
            vargs[0] = async
            for (var i = 0; i < I; i++) {
                vargs[i + 1] = arguments[i]
            }
            execute(this, steps, vargs, arguments[i])
        }
        break
    case 4:
        f = function (one, two, three, four) {
            var I = arguments.length - 1
            var vargs = new Array(I + 1)
            vargs[0] = async
            for (var i = 0; i < I; i++) {
                vargs[i + 1] = arguments[i]
            }
            execute(this, steps, vargs, arguments[i])
        }
        break
    default:
        // Avert your eyes if you're squeamish.
        var args = []
        for (var i = 0, I = steps[0].length; i < I; i++) {
            args[i] = '_' + i
        }
        f = (new Function('execute', 'steps', 'async', '                    \n\
            return function (' + args.join(',') + ') {                      \n\
                var I = arguments.length - 1                                \n\
                var vargs = new Array(I + 1)                                \n\
                vargs[0] = async                                            \n\
                for (var i = 0; i < I; i++) {                               \n\
                    vargs[i + 1] = arguments[i]                             \n\
                }                                                           \n\
                execute(this, steps, vargs, arguments[i])                   \n\
            }                                                               \n\
       '))(execute, steps, async)
    }

    f.toString = function () { return steps[0].toString() }

    return f
}

function variadic (f, self) {
    return function () {
        var I = arguments.length
        var vargs = new Array
        for (var i = 0; i < I; i++) {
            vargs.push(arguments[i])
        }
        return f.call(self, vargs)
    }
}

async.loop = variadic(function (steps) {
    var cadence = stack[stack.length - 1]
    var vargs = steps.shift()
    var callback = cadence.createCallback()
    var looper = new Cadence(cadence, cadence.self, steps, [], callback, cadence.outer)
    looper.loop = true
    looper.vargs = vargs
    looper.outer = looper
    cadence.cadences.push(looper)
    return {
        continue: { jump: JUMP, index: 0, break: false, cadence: looper },
        break: { jump: JUMP, index: Infinity, break: true, cadence: looper }
    }
}, async)

async.forEach = variadic(function (steps) {
    var loop, vargs = steps.shift(), array = vargs.shift(), index = -1
    steps.unshift(vargs, variadic(function (vargs) {
        index++
        if (index === array.length) return [ loop.break ].concat(vargs)
        return [ array[index], index ].concat(vargs)
    }))
    return loop = this.loop.apply(this, steps)
}, async)

async.map = variadic(function (steps) {
    var loop, vargs = steps.shift(), array = vargs.shift(), index = -1, gather = []
    steps.unshift(vargs, variadic(function (vargs) {
        index++
        if (index === array.length) return [ loop.break, gather ]
        return [ array[index], index ].concat(vargs)
    }))
    steps.push(variadic(function (vargs) {
        gather.push.apply(gather, vargs)
    }))
    return loop = this.loop.apply(this, steps)
}, async)

module.exports = cadence
