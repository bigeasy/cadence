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
            this.errors.push(error)
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
                push.apply(vargs, step.results[i].vargs)
            }
        }

        step = new Step(step)

        if (step.index == steps.length) {
            if (cadence.loop) {
                step.index = 0
            } else {
                cadence.done([ null ].concat(vargs))
                return null
            }
        }

        var fn = steps[step.index]

        if (Array.isArray(fn)) {
            if (fn.length === 1) {
                cadence.finalizers.push({ steps: fn, vargs: vargs })
                return step
            } else {
                step.catcher = fn[1]
                fn = fn[0]
            }
        }

        stack.push(step)

        var ret = call(fn, cadence.self, vargs)
               // ^^^^

        stack.pop()

        if (ret.length === 2) {
            step.errors.push(ret[1])
            step.vargs = vargs
            step.results.length = 0
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

        var step = new Step({
            index: -2,
            cadence: cadence,
            vargs: vargs
        })

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
