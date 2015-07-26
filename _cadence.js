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
        /* istanbul ignore next */
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

        step.cadence.loop = true
        push.apply(step.vargs, vargs)

        return {
            continue: { loopy: token, repeat: true, loop: false, cadence: cadence },
            break: { loopy: token, repeat: false, loop: false, cadence: cadence }
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

async.continue = { loopy: token, repeat: true, loop: false }
async.break = { loopy: token, repeat: false, loop: false }

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
    for (;;) {
        var vargs, cadence = step.cadence, steps = cadence.steps

        async.self = cadence.self

        if (step.errors.length) {
            if (step.catcher) {
                rescue(step)
            } else {
                cadence.done([ step.errors[0] ])
            }
            break
        }

        if (step.results.length == 0) {
            vargs = step.vargs
            if (vargs[0] && vargs[0].loopy === token) {
                var label = vargs.shift()
                if (label.cadence) {
                    cadence = step.cadence = label.cadence
                    steps = cadence.steps
                }
                step.index = label.repeat ? -1 : steps.length - 1
                cadence.loop = label.loop
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
                if (vargs.length !== 0) {
                    vargs.unshift(null)
                }
                cadence.done(vargs)
                break
            }
        }

        var fn = steps[step.index]

        if (Array.isArray(fn)) {
            if (fn.length === 1) {
                cadence.finalizers.push({ steps: fn, vargs: vargs })
                continue
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
                continue
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

        if (!step.sync) {
            step.next = step
            break
        }
    }
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
        f = (new Function('execute', 'steps', 'async', '                    \n\
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

function Sink (async, self, ee) {
    this._async = async
    this._self = self
    this._ee = ee
    this._listeners = []
    this._callback = async()
}

Sink.prototype._register = function (event, fn) {
    this._ee.on(event, fn)
    this._listeners.push({ event: event, fn: fn })
}

Sink.prototype.error = function (filter) {
    this._register('error', function (error) {
        if (filter) {
            error = call(filter, this._self, [ error ])[1]
        }
        if (error) {
            this._terminate([ error ])
        }
    }.bind(this))
    return this
}

Sink.prototype.end = function (event) {
    this._register(event, variadic(function (vargs) {
        vargs.unshift(null)
        this._terminate(vargs)
    }, this))
    return this
}

Sink.prototype._terminate = function (vargs) {
    for (var i = 0, I = this._listeners.length; i < I; i++) {
        var listener = this._listeners[i]
        this._ee.removeListener(listener.event, listener.fn)
    }
    this._callback.apply(null, vargs)
}

Sink.prototype.on = function (event, listener) {
    this._register(event, variadic(function (vargs) {
        var ret = call(listener, this._self, vargs)
        if (ret.length === 2) {
            this._terminate([ ret[1] ])
        }
    }, this))
    return this
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

async.ee = function (ee) {
    var async = this
    return new Sink(this, async.self, ee)
}

async.forEach = variadic(function (steps) {
    return variadic(function (vargs) {
        var loop, array = vargs.shift(), index = -1
        steps.unshift(variadic(function (vargs) {
            index++
            if (index === array.length) return [ loop.break ].concat(vargs)
            return [ array[index], index ].concat(vargs)
        }))
        return loop = this.apply(null, steps).apply(null, vargs)
    }, this)
}, async)

async.map = variadic(function (steps) {
    return variadic(function (vargs) {
        var loop, array = vargs.shift(), index = -1, gather = []
        steps.unshift(variadic(function (vargs) {
            index++
            if (index === array.length) return [ loop.break, gather ]
            return [ array[index], index ].concat(vargs)
        }))
        steps.push(variadic(function (vargs) {
            gather.push.apply(gather, vargs)
        }))
        return loop = this.apply(null, steps).apply(null, vargs)
    }, this)
}, async)

module.exports = cadence

/*

 % node --version
v0.10.40
 % node benchmark/increment/call.js
 cadence call 1 x 763,005 ops/sec ±0.46% (98 runs sampled)
_cadence call 1 x 779,945 ops/sec ±0.34% (99 runs sampled)
 cadence call 2 x 769,902 ops/sec ±0.53% (96 runs sampled)
_cadence call 2 x 776,500 ops/sec ±0.41% (101 runs sampled)
 cadence call 3 x 773,993 ops/sec ±0.30% (95 runs sampled)
_cadence call 3 x 783,422 ops/sec ±0.16% (104 runs sampled)
 cadence call 4 x 779,615 ops/sec ±0.22% (95 runs sampled)
_cadence call 4 x 783,339 ops/sec ±0.33% (102 runs sampled)
Fastest is _cadence call 3
 % node benchmark/increment/async.js
 cadence async 1 x 1,368,892 ops/sec ±0.29% (100 runs sampled)
_cadence async 1 x 1,420,740 ops/sec ±0.36% (99 runs sampled)
 cadence async 2 x 1,379,601 ops/sec ±0.53% (88 runs sampled)
_cadence async 2 x 1,428,447 ops/sec ±0.32% (103 runs sampled)
 cadence async 3 x 1,398,233 ops/sec ±0.28% (94 runs sampled)
_cadence async 3 x 1,435,184 ops/sec ±0.13% (102 runs sampled)
 cadence async 4 x 1,395,721 ops/sec ±0.25% (97 runs sampled)
_cadence async 4 x 1,422,195 ops/sec ±0.22% (102 runs sampled)
Fastest is _cadence async 3
 % vim benchmark/increment/loop.js
 % node benchmark/increment/loop.js
 cadence loop 1 x 165,911 ops/sec ±0.42% (98 runs sampled)
_cadence loop 1 x 165,290 ops/sec ±0.52% (101 runs sampled)
 cadence loop 2 x 164,438 ops/sec ±0.58% (101 runs sampled)
_cadence loop 2 x 165,436 ops/sec ±0.50% (99 runs sampled)
 cadence loop 3 x 167,022 ops/sec ±0.36% (99 runs sampled)
_cadence loop 3 x 166,932 ops/sec ±0.27% (100 runs sampled)
 cadence loop 4 x 165,271 ops/sec ±0.34% (102 runs sampled)
_cadence loop 4 x 167,520 ops/sec ±0.33% (103 runs sampled)
Fastest is _cadence loop 4, cadence loop 3
 % brew switch node 0.12.7
Cleaning /Users/alan/.usr/Cellar/node/0.10.26
Cleaning /Users/alan/.usr/Cellar/node/0.10.36
Cleaning /Users/alan/.usr/Cellar/node/0.10.40
Cleaning /Users/alan/.usr/Cellar/node/0.11.16
Cleaning /Users/alan/.usr/Cellar/node/0.12.4
Cleaning /Users/alan/.usr/Cellar/node/0.12.7
1883 links created for /Users/alan/.usr/Cellar/node/0.12.7
 % node --version
v0.12.7
 % node benchmark/increment/call.js
 cadence call 1 x 1,073,689 ops/sec ±0.20% (100 runs sampled)
_cadence call 1 x 1,075,390 ops/sec ±0.59% (99 runs sampled)
 cadence call 2 x 1,055,140 ops/sec ±0.36% (101 runs sampled)
_cadence call 2 x 1,075,502 ops/sec ±0.33% (98 runs sampled)
 cadence call 3 x 1,047,017 ops/sec ±0.37% (102 runs sampled)
_cadence call 3 x 1,067,931 ops/sec ±0.20% (101 runs sampled)
 cadence call 4 x 1,052,151 ops/sec ±0.19% (100 runs sampled)
_cadence call 4 x 1,059,161 ops/sec ±0.27% (102 runs sampled)
Fastest is _cadence call 2
 % node benchmark/increment/async.js
 cadence async 1 x 1,477,094 ops/sec ±0.58% (98 runs sampled)
_cadence async 1 x 1,378,995 ops/sec ±0.71% (95 runs sampled)
 cadence async 2 x 1,477,469 ops/sec ±0.39% (100 runs sampled)
_cadence async 2 x 1,408,498 ops/sec ±0.75% (97 runs sampled)
 cadence async 3 x 1,469,160 ops/sec ±0.25% (104 runs sampled)
_cadence async 3 x 1,405,748 ops/sec ±0.32% (101 runs sampled)
 cadence async 4 x 1,448,759 ops/sec ±0.15% (100 runs sampled)
_cadence async 4 x 1,398,510 ops/sec ±0.10% (102 runs sampled)
Fastest is  cadence async 2, cadence async 1
 % node benchmark/increment/loop.js
 cadence loop 1 x 109,011 ops/sec ±1.00% (95 runs sampled)
_cadence loop 1 x 89,791 ops/sec ±2.36% (90 runs sampled)
 cadence loop 2 x 73,242 ops/sec ±3.79% (77 runs sampled)
_cadence loop 2 x 76,937 ops/sec ±1.84% (88 runs sampled)
 cadence loop 3 x 75,064 ops/sec ±2.65% (86 runs sampled)
_cadence loop 3 x 74,536 ops/sec ±1.60% (90 runs sampled)
 cadence loop 4 x 64,999 ops/sec ±1.87% (88 runs sampled)
_cadence loop 4 x 58,227 ops/sec ±1.81% (75 runs sampled)
Fastest is  cadence loop 1

*/
