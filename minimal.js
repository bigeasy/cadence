! function (definition) {
    if (typeof window != "undefined") window.cadence = definition()
    else if (typeof define == "function") define(definition)
    else module.exports = definition()
} (function () {
    var stack = [], push = [].push, token = {}

    function Cadence (cadence, steps, done) {
        this.finalizers = cadence.finalizers
        this.self = cadence.self
        this.steps = steps
        this.done = done
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
        this.next = null
        this.vargs = step.vargs
    }

    Step.prototype.callback = function (result, vargs) {
        var error = vargs.shift()
        if (error == null) {
            push.apply(result.vargs, vargs)
        } else {
            result.errors.push(error)
        }
        if (++this.called === this.count) {
            if (this.next == null) {
                this.sync = true
            } else {
                invoke(this.next)
            }
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

        var cadence = new Cadence(self.cadence, vargs, function (vargs) {
            callback.apply(null, vargs)
        })

        var step = new Step({
            index: -2,
            cadence: cadence,
            vargs: []
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

    function cadence () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        return _cadence(vargs)
    }

    function call (fn, self, vargs) {
        try {
            var ret = fn.apply(self, vargs)
        } catch (e) {
            throw e
        }
        return { ret: ret }
    }

    function invoke (step) {
        while (step = _invoke(step)) { }
    }

    function _invoke (step) {
        var vargs, steps = step.cadence.steps
        if (step.results.length == 0) {
            vargs = step.vargs
            if (vargs[0] && vargs[0].invoke === token) {
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
                return null
            }
        }

        var fn = steps[step.index]

        if (Array.isArray(fn)) {
            if (fn.length == 1) {
                var cadence = new Cadence({
                    invocation: step.cadence.invocation,
                    steps: [ fn ],
                    done: null
                })
                var finalizer = new Step({
                    cadence: cadence,
                    index: -1,
                    vargs: vargs
                })
                cadence.finalizers.push(finalizer)
                return step
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
                result.starter(token)
            }
        }
        step.vargs = [].concat(ret === void(0) ? vargs : ret)

        if (step.sync) {
            return step
        }

        step.next = step
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

        var cadence = new Cadence({ finalizers: [], self: self }, steps, done)

        var step = new Step({
            index: -2,
            cadence: cadence,
            vargs: vargs
        })

        invoke(step)

        function done (vargs) {
            for (var i = 0, I = cadence.finalizers.length; i < I; i++) {
            }
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
