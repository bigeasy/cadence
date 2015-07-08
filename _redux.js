! function (definition) {
    /* istanbul ignore next */
    if (typeof module === 'object') module.exports = definition()
    else if (typeof window !== 'undefined') window.cadence = definition()
    else if (typeof define === 'function') define(definition)
} (function () {
    var stack = [], push = [].push, token = {}

    function Cadence (cadence, steps, done) {
        this.finalizers = cadence.finalizers
        this.self = cadence.self
        this.steps = steps
        this.done = done
        this.loop = false
    }

    function Step (cadence, index, vargs) {
        this.cadence = cadence
        this.results = []
        this.errors = []
        this.called = 0
        this.index = index
        this.sync = true
        this.next = null
        this.vargs = vargs
    }

    Step.prototype.callback = function (result, vargs) {
        var error = vargs.shift()
        if (error == null) {
            result.vargs = vargs
        } else {
            this.errors.push(error)
        }
        if (++this.called === this.results.length) {
            if (this.next == null) {
                this.sync = true
            } else {
                invoke(this.next)
            }
        }
    }

    Step.prototype.createCallback = function () {
        var self = this
        var result = { vargs: [], starter: null }

        self.results.push(result)
        self.sync = false

        return callback

        function callback () {
            var I = arguments.length
            var vargs = new Array(I)
            for (var i = 0; i < I; i++) {
                vargs[i] = arguments[i]
            }
            self.callback(result, vargs)
        }
    }

    Step.prototype.createCadence = function (vargs) {
        var self = this

        var callback = this.createCallback()

        var result = this.results[this.results.length - 1]

        var cadence = new Cadence(self.cadence, vargs, function (vargs) {
            callback.apply(null, vargs)
        })

        var step = new Step(cadence, -1, [])

        return result.starter = starter

        function starter () {
            var I = arguments.length
            var vargs = new Array(I)
            for (var i = 0; i < I; i++) {
                vargs[i] = arguments[i]
            }
            return self.starter(step, result, vargs)
        }
    }

    Step.prototype.starter = function (step, result, vargs) {
        if (vargs[0] === token) {
            invoke(step)
        } else {
            var count = 0, cadence = step.cadence

            label.invoke = token
            label.loop = false
            label.cadence = cadence
            label.index = cadence.steps.length

            step.index = -1
            step.cadence.loop = true
            push.apply(step.vargs, vargs)

            return label

            function label () {
                return {
                    invoke: token,
                    loop: true,
                    cadence: cadence,
                    index: 0
                }
            }
        }
    }

    function async () {
        var step = stack[stack.length - 1]
        var I = arguments.length
        if (I) {
            var vargs = new Array(I)
            for (var i = 0; i < I; i++) {
                vargs[i] = arguments[i]
            }
            return step.createCadence(vargs)
        } else {
            return step.createCallback()
        }
    }

    async.__defineGetter__('self', function () {
        return stack[stack.length - 1].cadence.self
    })

    function call (fn, self, vargs) {
        try {
            var ret = fn.apply(self, vargs)
        } catch (e) {
            return [ ret, e ]
        }
        return [ ret ]
    }

    function rescue (step) {
        if (step.errors.length === 0) {
            invoke(step)
        } else {
            var error = step.errors.shift()

            execute(step.cadence.self, [
                step.catcher,
                function () {
                    var I = arguments.length
                    var vargs = new Array(I)
                    for (var i = 0; i < I; i++) {
                        vargs[i] = arguments[i]
                    }
                    if (vargs[0] !== error) {
                        step.vargs = vargs
                        step.results.length = 0
                    }
                }
            ], [ error, done ])

            function done (error) {
                if (error) {
                    step.cadence.done([ error ])
                } else {
                    rescue(step)
                }
            }
        }
    }

    function invoke (step) {
        while (step = _invoke(step)) { }
    }

    function _invoke (step) {
        var vargs, cadence = step.cadence, steps = cadence.steps

        if (step.errors.length) {
            if (step.catcher) {
                rescue(step)
            } else {
                cadence.done([ step.errors[0] ])
            }
            return null
        }

        if (step.results.length == 0) {
            vargs = step.vargs
            if (vargs[0] && vargs[0].invoke === token) {
                var label = vargs.shift()
                cadence = step.cadence = label.cadence
                cadence.loop = label.loop
                step.index = label.index - 1
                steps = cadence.steps
            }
        } else {
            vargs = []
            for (var i = 0, I = step.results.length; i < I; i++) {
                var vargs_ = step.results[i].vargs
                for (var j = 0, J = vargs_.length; j < J; j++) {
                    vargs.push(vargs_[j])
                }
            }
        }

        step = new Step(step.cadence, step.index + 1, vargs)

        if (step.index == steps.length) {
            if (cadence.loop) {
                step.index = 0
            } else {
                cadence.done(vargs.length === 0 ? [] : [ null ].concat(vargs))
                return null
            }
        }

        var fn = steps[step.index]

        if (Array.isArray(fn)) {
            if (fn.length === 1) {
                cadence.finalizers.push({ steps: fn, vargs: vargs })
                return step
            } else if (fn.length === 2) {
                step.catcher = fn[1]
                fn = fn[0]
            } else if (fn.length === 3) {
                var filter = fn
                step.catcher = function (error) {
                    if (filter[1].test(error.code || error.message)) {
                        return filter[2](error)
                    } else {
                        throw error
                    }
                }
                fn = fn[0]
            } else {
                step.vargs = [ step.vargs ]
                return step
            }
        }

        stack.push(step)

        var ret = call(fn, cadence.self, vargs)
               // ^^^^

        stack.pop()

        if (ret.length === 2) {
            step.errors.push(ret[1])
            step.vargs = vargs
            step.sync = true
        } else {
            for (var i = 0, I = step.results.length; i < I; i++) {
                var result = step.results[i]
                if (result.starter) {
                    result.starter(token)
                }
            }
            step.vargs = [].concat(ret[0] === void(0) ? vargs : ret[0])
        }

        if (step.sync) {
            return step
        }

        step.next = step
        return null
    }

    function finalize (cadence, errors, callback, vargs) {
        if (cadence.finalizers.length == 0) {
            if (errors.length === 0) {
                callback.apply(null, vargs)
            } else {
                callback.apply(null, [ errors[0] ])
            }
        } else {
            var finalizer = cadence.finalizers.pop()
            execute(cadence.self, finalizer.steps, finalizer.vargs.concat(done))
        }
        function done (error) {
            if (error) {
                errors.push(error)
            }
            finalize(cadence, errors, callback, vargs)
        }
    }

    function execute (self, steps, vargs) {
        var callback = vargs.pop()

        var cadence = new Cadence({ finalizers: [], self: self }, steps, done)

        var step = new Step(cadence, -1, vargs)

        // async.self = self

        invoke(step)

        function done (vargs) {
            if (cadence.finalizers.length == 0) {
                callback.apply(null, vargs)
            } else {
                finalize(cadence, [], callback, vargs)
            }
        }
    }

    function cadence () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        return _cadence(vargs)
    }

    function _cadence (steps) {
        var f

        switch (steps[0].length) {
        case 0:
            f = function () {
                var I = arguments.length
                var vargs = new Array(I + 1)
                vargs[0] = async
                for (var i = 0; i < I; i++) {
                    vargs[i + 1] = arguments[i]
                }
                execute(this, steps, vargs)
            }
            break
        case 1:
            f = function (one) {
                var I = arguments.length
                var vargs = new Array(I + 1)
                vargs[0] = async
                for (var i = 0; i < I; i++) {
                    vargs[i + 1] = arguments[i]
                }
                execute(this, steps, vargs)
            }
            break
        case 2:
            f = function (one, two) {
                var I = arguments.length
                var vargs = new Array(I + 1)
                vargs[0] = async
                for (var i = 0; i < I; i++) {
                    vargs[i + 1] = arguments[i]
                }
                execute(this, steps, vargs)
            }
            break
        case 3:
            f = function (one, two, three) {
                var I = arguments.length
                var vargs = new Array(I + 1)
                vargs[0] = async
                for (var i = 0; i < I; i++) {
                    vargs[i + 1] = arguments[i]
                }
                execute(this, steps, vargs)
            }
            break
        case 4:
            f = function (one, two, three, four) {
                var I = arguments.length
                var vargs = new Array(I + 1)
                vargs[0] = async
                for (var i = 0; i < I; i++) {
                    vargs[i + 1] = arguments[i]
                }
                execute(this, steps, vargs)
            }
            break
        default:
            // Avert your eyes if you're squeamish.
            var args = []
            for (var i = 0, I = steps[0].length; i < I; i++) {
                args[i] = '_' + i
            }
            var f = (new Function('execute', 'steps', 'async', '                \n\
                return function (' + args.join(',') + ') {                      \n\
                    var I = arguments.length                                    \n\
                    var vargs = new Array(I + 1)                                \n\
                    vargs[0] = async                                            \n\
                    for (var i = 0; i < I; i++) {                               \n\
                        vargs[i + 1] = arguments[i]                             \n\
                    }                                                           \n\
                    execute(this, steps, vargs)                                 \n\
                }                                                               \n\
           '))(execute, steps, async)
        }

        f.toString = function () { return steps[0].toString() }

        f.isCadence = true

        return f
    }

    return cadence
})

// % node benchmark/increment/loop.js
//  cadence loop 1 x 467 ops/sec ±0.80% (93 runs sampled)
// _cadence loop 1 x 472 ops/sec ±0.99% (92 runs sampled)
//  cadence loop 2 x 469 ops/sec ±0.86% (94 runs sampled)
// _cadence loop 2 x 467 ops/sec ±1.58% (91 runs sampled)
//  cadence loop 3 x 455 ops/sec ±0.97% (91 runs sampled)
// _cadence loop 3 x 467 ops/sec ±1.26% (91 runs sampled)
//  cadence loop 4 x 465 ops/sec ±1.46% (91 runs sampled)
// _cadence loop 4 x 460 ops/sec ±2.14% (86 runs sampled)
// Fastest is _cadence loop 1, cadence loop 2,_cadence loop 3,_cadence loop 2, cadence loop 4,_cadence loop 4

// % node benchmark/increment/call.js
//  cadence call 0 x 785,362 ops/sec ±0.85% (93 runs sampled)
// _cadence call 0 x 702,759 ops/sec ±0.86% (98 runs sampled)
//  cadence call 1 x 787,596 ops/sec ±0.77% (101 runs sampled)
// _cadence call 1 x 695,270 ops/sec ±0.83% (96 runs sampled)
//  cadence call 2 x 792,054 ops/sec ±0.84% (99 runs sampled)
// _cadence call 2 x 693,710 ops/sec ±0.88% (100 runs sampled)
//  cadence call 3 x 794,482 ops/sec ±0.83% (98 runs sampled)
// _cadence call 3 x 694,428 ops/sec ±0.85% (96 runs sampled)
// Fastest is  cadence call 3

// % node benchmark/increment/async.js
//  cadence async 0 x 1,261,444 ops/sec ±0.72% (96 runs sampled)
// _cadence async 0 x 1,094,193 ops/sec ±0.76% (98 runs sampled)
//  cadence async 1 x 1,241,830 ops/sec ±0.89% (96 runs sampled)
// _cadence async 1 x 1,076,718 ops/sec ±0.87% (97 runs sampled)
//  cadence async 2 x 1,242,406 ops/sec ±0.77% (99 runs sampled)
// _cadence async 2 x 1,093,476 ops/sec ±0.84% (99 runs sampled)
//  cadence async 3 x 1,258,202 ops/sec ±0.75% (98 runs sampled)
// _cadence async 3 x 1,112,983 ops/sec ±0.71% (101 runs sampled)
// Fastest is  cadence async 0, cadence async 3

// % node benchmark/increment/async.js
//  cadence parallel 1 x 5,984 ops/sec ±0.92% (98 runs sampled)
// _cadence parallel 1 x 6,049 ops/sec ±0.71% (96 runs sampled)
//  cadence parallel 2 x 6,001 ops/sec ±0.91% (97 runs sampled)
// _cadence parallel 2 x 6,009 ops/sec ±1.21% (98 runs sampled)
//  cadence parallel 3 x 5,991 ops/sec ±0.83% (98 runs sampled)
// _cadence parallel 3 x 6,027 ops/sec ±0.87% (97 runs sampled)
//  cadence parallel 4 x 5,927 ops/sec ±0.95% (96 runs sampled)
// _cadence parallel 4 x 6,016 ops/sec ±0.95% (99 runs sampled)
// Fastest is _cadence parallel 1,_cadence parallel 3,_cadence parallel 4, cadence parallel 2,_cadence parallel 2
