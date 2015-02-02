! function (definition) {
    if (typeof window != "undefined") window.cadence = definition()
    else if (typeof define == "function") define(definition)
    else module.exports = definition()
} (function () {
    var stack = [], push = [].push

    function Cadence (options) {
        this.self = options.self
        this.steps = options.steps
        this.done = options.done
        this.loop = false
    }

    function Step (step) {
        this.cadence = step.cadence
        this.results = []
        this.errors = []
        this.count = 0
        this.called = 0
        this.index = step.index + 1
        this.sync = true
        this.vargs = step.vargs || []
    }

    Step.prototype.join = function () {
        this.sync = true
    }

    Step.prototype.callback = function (result, vargs) {
        var error = vargs.shift()
        if (error) {
            result.errors.push(error)
        } else {
            push.apply(result.vargs, vargs)
        }
        if (++this.called === this.count) {
            this.join()
        }
    }

    Step.prototype.createCallback = function () {
        var self = this
        var result = { vargs: [] }

        self.results.push(result)
        self.count++
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

        var cadence = new Cadence({
            self: self.cadence.self,
            steps: vargs,
            done: function (vargs) {
                callback.apply(null, vargs)
            }
        })

        var step = new Step({
            index: -2,
            cadence: cadence
        })

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
        if (vargs[0] === invoke) {
            invoke(step)
        } else {
            var count = 0, cadence = step.cadence

            label.invoke = invoke
            label.loop = false
            label.cadence = cadence
            label.index = cadence.steps.length

            step.index = -1
            step.cadence.loop = true
            push.apply(step.vargs, vargs)

            return label

            function label () {
                return {
                    invoke: invoke,
                    loop: true,
                    cadence: cadence,
                    index: 0
                }
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

    function invoke (step) {
        var f = _invoke(step)
        while (f) f = f()
    }

    function call (fn, self, vargs) {
        try {
            var ret = fn.apply(self, vargs)
        } catch (e) {
            throw e
        }
        return { ret: ret }
    }

    function _invoke (step) {
        var vargs, steps = step.cadence.steps
        if (step.results.length == 0) {
            vargs = step.vargs
            if (vargs[0] && vargs[0].invoke === invoke) {
                var label = vargs.shift()
                step.cadence = label.cadence
                step.cadence.loop = label.loop
                step.index = label.index - 1
            }
        } else {
            vargs = []
            for (var i = 0, I = step.results.length; i < I; i++) {
                push.apply(vargs, step.results[i].vargs)
            }
        }

        if (step.errors.length) {
            throw new Error
        }

        step = new Step(step)

        if (step.index == steps.length) {
            var cadence = step.cadence
            if (cadence.loop) {
                step.index = 0
            } else {
                cadence.done([ null ].concat(vargs))
                return
            }
        }

        var fn = steps[step.index]

        if (Array.isArray(fn)) {
            if (fn.length == 1) {
                var cadence = new Cadence({
                    self: step.cadence.self,
                    steps: fn
                })
                var finalizer = new Step({
                    cadence: cadence,
                    index: -1,
                    vargs: vargs
                })
                cadence.finalizers.push(finalizer)
                return function () { return _invoke(step) }
            }
            throw new Error
        }

        stack.push(step)
        var outcome = call(fn, step.cadence.self, vargs)
        var ret = outcome.ret
        stack.pop()
        for (var i = 0, I = step.results.length; i < I; i++) {
            var result = step.results[i]
            if (result.starter) {
                result.starter(invoke)
            }
        }
        step.vargs = [].concat(ret === void(0) ? vargs : ret)

        if (step.sync) {
            return function () { return _invoke(step) }
        }

        step.join = function () { invoke(step) }
        return null
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

    function execute (self, steps, vargs) {
        var callback = vargs.pop()

        var cadence = new Cadence({
            self: self,
            steps: steps,
            done: done
        })

        var step = new Step({
            index: -2,
            cadence: cadence,
            vargs: vargs
        })

        invoke(step)

        function done (vargs) {
            callback.apply(null, vargs)
        }
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
            for (var i = 0; i < steps[0].length; i++) {
                args[i] = '_' + i
            }

            var f = (new Function('execute', 'steps', 'return function (' + args.join(',') + ') {' +
                'execute.call(this, steps, Array.prototype.slice.call(arguments))' +
            '}'))(execute, steps)
        }

        f.toString = function () { return steps[0].toString() }

        f.isCadence = true

        return f
    }

    return cadence
})
