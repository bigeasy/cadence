! function (definition) {
    /* istanbul ignore next */
    if (typeof module === 'object') module.exports = definition()
    else if (typeof window !== 'undefined') window.cadence = definition()
    else if (typeof define === 'function') define(definition)
} (function () {
    var stack = [], push = [].push, token = {}

    function Cadence (cadence, steps, callback) {
        this.finalizers = cadence.finalizers
        this.self = cadence.self
        this.steps = steps
        this.callback = callback
        this.loop = false
    }

    Cadence.prototype.done = function (vargs) {
        if (this.finalizers.length == 0) {
            this.callback.apply(null, vargs)
        } else {
            finalize(this, [], this.callback, vargs)
        }
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

            return

            // This try/catch will prevent V8 from marking this function of
            // optimization because it will only ever run once.
            try {} catch(e) {}
        }
    }

    Step.prototype.createCadence = function (vargs) {
        var self = this

        var callback = this.createCallback()

        var result = this.results[this.results.length - 1]

        var cadence = new Cadence(self.cadence, vargs, callback)

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

        var cadence = new Cadence({ finalizers: [], self: self }, steps, callback)

        var step = new Step(cadence, -1, vargs)

        // async.self = self

        invoke(step)
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

        // Preserving arity costs next to nothing; the call to `execute` in
        // these functions will be inlined. The airty function itself will never
        // be inlined because it is in a different context than that of our
        // dear user, but it will be compiled.
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

/*

 % node --version
v0.12.7
 % node benchmark/increment/loop.js
 cadence loop 1 x 99,896 ops/sec ±1.27% (92 runs sampled)
_cadence loop 1 x 92,420 ops/sec ±1.36% (91 runs sampled)
 cadence loop 2 x 81,548 ops/sec ±1.59% (91 runs sampled)
_cadence loop 2 x 75,859 ops/sec ±1.57% (88 runs sampled)
 cadence loop 3 x 65,524 ops/sec ±2.91% (85 runs sampled)
_cadence loop 3 x 71,998 ops/sec ±1.68% (87 runs sampled)
 cadence loop 4 x 61,505 ops/sec ±1.99% (87 runs sampled)
_cadence loop 4 x 56,529 ops/sec ±1.34% (86 runs sampled)
Fastest is  cadence loop 1
 % node benchmark/increment/call.js
 cadence call 0 x 957,343 ops/sec ±0.82% (97 runs sampled)
_cadence call 0 x 938,918 ops/sec ±0.79% (97 runs sampled)
 cadence call 1 x 939,578 ops/sec ±0.74% (101 runs sampled)
_cadence call 1 x 941,921 ops/sec ±0.77% (98 runs sampled)
 cadence call 2 x 914,186 ops/sec ±0.78% (100 runs sampled)
_cadence call 2 x 913,468 ops/sec ±0.62% (98 runs sampled)
 cadence call 3 x 908,897 ops/sec ±0.63% (99 runs sampled)
_cadence call 3 x 905,522 ops/sec ±0.71% (98 runs sampled)
Fastest is  cadence call 0
 % node benchmark/increment/async.js
 cadence async 0 x 1,152,088 ops/sec ±0.87% (94 runs sampled)
_cadence async 0 x 1,210,416 ops/sec ±0.85% (95 runs sampled)
 cadence async 1 x 1,119,064 ops/sec ±0.81% (96 runs sampled)
_cadence async 1 x 1,169,882 ops/sec ±0.76% (94 runs sampled)
 cadence async 2 x 1,123,586 ops/sec ±0.60% (97 runs sampled)
_cadence async 2 x 1,140,971 ops/sec ±0.68% (96 runs sampled)
 cadence async 3 x 1,188,253 ops/sec ±0.44% (99 runs sampled)
_cadence async 3 x 1,129,772 ops/sec ±0.82% (96 runs sampled)
Fastest is _cadence async 0
 % node --version
v0.10.40
 % node benchmark/increment/loop.js
 cadence loop 1 x 151,780 ops/sec ±0.82% (98 runs sampled)
_cadence loop 1 x 148,885 ops/sec ±0.90% (98 runs sampled)
 cadence loop 2 x 150,407 ops/sec ±0.78% (99 runs sampled)
_cadence loop 2 x 148,986 ops/sec ±0.74% (99 runs sampled)
 cadence loop 3 x 150,264 ops/sec ±0.77% (99 runs sampled)
_cadence loop 3 x 149,977 ops/sec ±0.71% (99 runs sampled)
 cadence loop 4 x 151,169 ops/sec ±0.67% (101 runs sampled)
_cadence loop 4 x 147,351 ops/sec ±0.97% (99 runs sampled)
Fastest is  cadence loop 1
 % node benchmark/increment/call.js
 cadence call 0 x 608,576 ops/sec ±0.93% (94 runs sampled)
_cadence call 0 x 615,065 ops/sec ±0.80% (95 runs sampled)
 cadence call 1 x 605,789 ops/sec ±0.94% (97 runs sampled)
_cadence call 1 x 618,356 ops/sec ±0.90% (99 runs sampled)
 cadence call 2 x 605,773 ops/sec ±0.93% (94 runs sampled)
_cadence call 2 x 618,876 ops/sec ±0.69% (93 runs sampled)
 cadence call 3 x 599,475 ops/sec ±1.11% (93 runs sampled)
_cadence call 3 x 613,082 ops/sec ±0.88% (97 runs sampled)
Fastest is _cadence call 2,_cadence call 0
 % node benchmark/increment/async.js
 cadence async 0 x 1,281,612 ops/sec ±0.89% (95 runs sampled)
_cadence async 0 x 1,245,967 ops/sec ±0.81% (99 runs sampled)
 cadence async 1 x 1,262,932 ops/sec ±1.25% (96 runs sampled)
_cadence async 1 x 1,240,795 ops/sec ±0.80% (99 runs sampled)
 cadence async 2 x 1,263,494 ops/sec ±1.11% (97 runs sampled)
_cadence async 2 x 1,229,240 ops/sec ±0.64% (99 runs sampled)
 cadence async 3 x 1,280,354 ops/sec ±0.97% (96 runs sampled)
_cadence async 3 x 1,209,518 ops/sec ±0.98% (97 runs sampled)
Fastest is  cadence async 0, cadence async 3, cadence async 2, cadence async 1

*/
