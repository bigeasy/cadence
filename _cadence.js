var stack = [], push = [].push, token = {}

function Cadence (parent, finalizers, self, steps, vargs, callback) {
    this.parent = parent
    this.finalizers = finalizers
    this.self = self
    this.steps = steps
    this.callback = callback
    this.loop = false
    this.cadence = cadence
    this.cadences = []
    this.results = []
    this.errors = []
    this.called = 0
    this.index = 0
    this.sync = true
    this.waiting = false
    this.vargs = vargs
}

Cadence.prototype.done = function (vargs) {
    if (this.finalizers.length == 0) {
        this.callback.apply(null, vargs)
    } else {
        finalize(this, [], this.callback, vargs)
    }
}

Cadence.prototype.resolveCallback = function (result, vargs) {
    var error = vargs.shift()
    if (error == null) {
        result.vargs = vargs
    } else {
        this.errors.push(error)
    }
    if (++this.called === this.results.length) {
        if (this.waiting) {
            invoke(this)
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

    function callback () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        self.resolveCallback(result, vargs)

        return

        // This try/catch will prevent V8 from marking this function of
        // optimization because it will only ever run once.
        /* istanbul ignore next */
        try {} catch(e) {}
    }
}

Cadence.prototype.createCadence = function (vargs) {
    var callback = this.createCallback()

    var cadence = new Cadence(this, this.finalizers, this.self, vargs, [], callback)

    this.cadences.push(cadence)

    return looper

    function looper () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        return cadence.startLoop(vargs)
    }
}

Cadence.prototype.startLoop = function (vargs) {
    this.loop = true
    this.vargs = vargs

    return {
        continue: { loopy: token, repeat: true, loop: false, cadence: this },
        break: { loopy: token, repeat: false, loop: false, cadence: this }
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
        return cadence.createCadence(vargs)
    } else {
        return cadence.createCallback()
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

function rescue (cadence) {
    if (cadence.errors.length === 0) {
        invoke(cadence)
    } else {
        var error = cadence.errors.shift()

        execute(cadence.self, [
            cadence.catcher,
            function () {
                var I = arguments.length
                var vargs = new Array(I)
                for (var i = 0; i < I; i++) {
                    vargs[i] = arguments[i]
                }
                if (vargs[0] !== error) {
                    cadence.vargs = vargs
                    cadence.results.length = 0
                }
            }
        ], [ error, done ])

        function done (error) {
            if (error) {
                cadence.done([ error ])
            } else {
                rescue(cadence)
            }
        }
    }
}

function invoke (cadence) {
    for (;;) {
        var vargs, steps = cadence.steps

        async.self = cadence.self
        async.cadence = cadence

        if (cadence.errors.length) {
            if (cadence.catcher) {
                rescue(cadence)
            } else {
                cadence.done([ cadence.errors[0] ])
            }
            break
        }

        if (cadence.results.length == 0) {
            vargs = cadence.vargs
            if (vargs[0] && vargs[0].loopy === token) {
                var label = vargs.shift()
                var destination = label.cadence || cadence
                var iterator = cadence
                while (destination !== iterator) {
                    iterator.loop = false
                    iterator.index = iterator.steps.length
                    iterator = iterator.parent
                }
                iterator.index = label.repeat ? 0 : iterator.steps.length
                iterator.loop = label.loop
            }
        } else {
            vargs = []
            for (var i = 0, I = cadence.results.length; i < I; i++) {
                var vargs_ = cadence.results[i].vargs
                for (var j = 0, J = vargs_.length; j < J; j++) {
                    vargs.push(vargs_[j])
                }
            }
        }

        cadence.called = 0
        cadence.cadences = []
        cadence.results = []
        cadence.errors = []
        cadence.sync = true

        if (cadence.index == steps.length) {
            if (cadence.loop) {
                cadence.index = 0
            } else {
                if (vargs.length !== 0) {
                    vargs.unshift(null)
                }
                cadence.done(vargs)
                break
            }
        }

        var fn = steps[cadence.index++]

        if (Array.isArray(fn)) {
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
                        return filter[2](error)
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

        var ret = call(fn, cadence.self, vargs)
               // ^^^^

        stack.pop()

        if (ret.length === 2) {
            cadence.errors.push(ret[1])
            cadence.vargs = vargs
            cadence.sync = true
        } else {
            for (var i = 0, I = cadence.cadences.length; i < I; i++) {
                invoke(cadence.cadences[i])
            }
            cadence.vargs = [].concat(ret[0] === void(0) ? vargs : ret[0])
        }

        if (!cadence.sync) {
            cadence.waiting = true
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

    var cadence = new Cadence(null, [], self, steps, vargs, callback)

    // async.self = self

    invoke(cadence)
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
 cadence call 1 x 706,040 ops/sec ±0.32% (96 runs sampled)
_cadence call 1 x 687,558 ops/sec ±0.29% (95 runs sampled)
 cadence call 2 x 705,161 ops/sec ±0.39% (91 runs sampled)
_cadence call 2 x 699,459 ops/sec ±0.26% (103 runs sampled)
 cadence call 3 x 703,959 ops/sec ±0.40% (98 runs sampled)
_cadence call 3 x 694,343 ops/sec ±0.43% (103 runs sampled)
 cadence call 4 x 703,278 ops/sec ±0.17% (101 runs sampled)
_cadence call 4 x 705,599 ops/sec ±0.48% (97 runs sampled)
Fastest is  cadence call 1, cadence call 2,_cadence call 4
 % node benchmark/increment/async.js
 cadence async 1 x 1,146,211 ops/sec ±0.65% (101 runs sampled)
_cadence async 1 x 1,163,469 ops/sec ±0.23% (103 runs sampled)
 cadence async 2 x 1,138,957 ops/sec ±0.48% (98 runs sampled)
_cadence async 2 x 1,154,732 ops/sec ±0.33% (100 runs sampled)
 cadence async 3 x 1,130,315 ops/sec ±0.72% (101 runs sampled)
_cadence async 3 x 1,171,068 ops/sec ±0.45% (96 runs sampled)
 cadence async 4 x 1,187,923 ops/sec ±0.38% (102 runs sampled)
_cadence async 4 x 1,189,578 ops/sec ±0.31% (97 runs sampled)
Fastest is _cadence async 4, cadence async 4
 % node benchmark/increment/loop.js
 cadence loop 1 x 160,060 ops/sec ±0.42% (103 runs sampled)
_cadence loop 1 x 164,899 ops/sec ±0.28% (102 runs sampled)
 cadence loop 2 x 158,695 ops/sec ±0.38% (100 runs sampled)
_cadence loop 2 x 166,223 ops/sec ±0.51% (101 runs sampled)
 cadence loop 3 x 162,292 ops/sec ±0.33% (99 runs sampled)
_cadence loop 3 x 165,486 ops/sec ±0.44% (100 runs sampled)
 cadence loop 4 x 160,072 ops/sec ±0.32% (102 runs sampled)
_cadence loop 4 x 164,396 ops/sec ±0.27% (102 runs sampled)
Fastest is _cadence loop 2
 % node --version
v0.12.7
 % node benchmark/increment/call.js
 cadence call 1 x 1,035,031 ops/sec ±0.35% (99 runs sampled)
_cadence call 1 x 1,037,330 ops/sec ±0.65% (100 runs sampled)
 cadence call 2 x 1,025,747 ops/sec ±0.39% (100 runs sampled)
_cadence call 2 x 1,035,335 ops/sec ±0.41% (97 runs sampled)
 cadence call 3 x 1,038,427 ops/sec ±0.40% (100 runs sampled)
_cadence call 3 x 1,027,024 ops/sec ±0.58% (98 runs sampled)
 cadence call 4 x 1,031,719 ops/sec ±0.33% (99 runs sampled)
_cadence call 4 x 1,026,186 ops/sec ±0.24% (99 runs sampled)
Fastest is  cadence call 3,_cadence call 1
 % node benchmark/increment/async.js
 cadence async 1 x 1,497,986 ops/sec ±0.71% (99 runs sampled)
_cadence async 1 x 1,485,923 ops/sec ±0.58% (101 runs sampled)
 cadence async 2 x 1,450,796 ops/sec ±0.66% (96 runs sampled)
_cadence async 2 x 1,519,108 ops/sec ±0.29% (99 runs sampled)
 cadence async 3 x 1,521,727 ops/sec ±0.50% (92 runs sampled)
_cadence async 3 x 1,503,341 ops/sec ±0.31% (103 runs sampled)
 cadence async 4 x 1,504,095 ops/sec ±0.37% (101 runs sampled)
_cadence async 4 x 1,469,961 ops/sec ±0.56% (101 runs sampled)
Fastest is _cadence async 2, cadence async 3, cadence async 1
 % node benchmark/increment/loop.js
 cadence loop 1 x 109,737 ops/sec ±1.39% (89 runs sampled)
_cadence loop 1 x 102,187 ops/sec ±1.61% (90 runs sampled)
 cadence loop 2 x 88,741 ops/sec ±1.64% (90 runs sampled)
_cadence loop 2 x 83,240 ops/sec ±1.44% (87 runs sampled)
 cadence loop 3 x 79,677 ops/sec ±2.63% (91 runs sampled)
_cadence loop 3 x 76,962 ops/sec ±1.48% (92 runs sampled)
 cadence loop 4 x 63,574 ops/sec ±1.20% (84 runs sampled)
_cadence loop 4 x 63,654 ops/sec ±4.41% (85 runs sampled)
Fastest is  cadence loop 1

*/
