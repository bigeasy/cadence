! function (definition) {
    if (typeof window != "undefined") window.cadence = definition()
    else if (typeof define == "function") define(definition)
    else module.exports = definition()
} (function () {
    var stack = [], slice = [].slice, push = [].push

    function Cadence (options) {
        this.self = options.self
        this.steps = options.steps
        this.done = options.done
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
        if (++this.called == this.count) {
            this.join()
        }
    }

    Step.prototype.createCallback = function () {
        var self = this
        var result = new Result

        self.results.push(result)
        self.count++
        self.sync = false

        return callback

        function callback () { self.callback(result, slice.call(arguments)) }
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

        return result.starter = function () {
            return self.starter(step, result, slice.call(arguments))
        }
    }

    Step.prototype.starter = function (step, result, vargs) {
        if (vargs[0] === invoke) {
            invoke(step)
        } else {
            var count = 0, cadence = step.cadence

            step.cadence.steps.push(loop)

            label.invoke = invoke
            label.cadence = cadence
            label.index = cadence.steps.length

            step.index = cadence.steps.length - 2
            push.apply(step.vargs, vargs)

            return label

            function label () {
                return {
                    invoke: invoke,
                    cadence: cadence,
                    index: 0
                }
            }

            function loop () {
                var I = arguments.length
                var vargs = new Array(I + 2)
                vargs[0] = label()
                vargs[1] = count++
                for (var i = 0; i < I; i++) {
                    vargs[i + 2] = arguments[i]
                }
                return vargs
            }
        }
    }

    function Result () {
        this.vargs = []
    }

    function cadence () {
        return _cadence(slice.call(arguments))
    }

    function invoke (step) {
        var f = _invoke(step)
        while (f) f = f()
    }

    function _invoke (step) {
        var vargs, steps = step.cadence.steps
        if (step.results.length == 0) {
            vargs = step.vargs
            if (vargs[0] && vargs[0].invoke === invoke) {
                var label = vargs.shift()
                step.index = label.index - 1
                step.cadence = label.cadence
            }
        } else {
            vargs = []
            for (var i = 0, I = step.results.length; i < I; i++) {
                push.apply(vargs, step.results[i].vargs)
            }
        }

        if (step.errors.length) {
        }

        step = new Step(step)

        if (step.index == steps.length) {
            step.cadence.done([ null ].concat(vargs))
            return
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
        try {
            var ret = fn.apply(step.cadence.self, vargs)
        } catch (e) {
            throw e
        }
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

    function execute (steps, vargs) {
        var callback = vargs.pop()

        var cadence = new Cadence({
            self: this,
            steps: steps,
            done: done
        })

        var step = new Step({
            index: -2,
            cadence: cadence,
            vargs: [ async ].concat(vargs)
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
                execute.call(this, steps, slice.call(arguments))
            }
            break
        case 1:
            f = function (one) {
                execute.call(this, steps, slice.call(arguments))
            }
            break
        case 2:
            f = function (one, two) {
                execute.call(this, steps, slice.call(arguments))
            }
            break
        case 3:
            f = function (one, two, three) {
                execute.call(this, steps, slice.call(arguments))
            }
            break
        case 4:
            f = function (one, two, three, four) {
                execute.call(this, steps, slice.call(arguments))
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
