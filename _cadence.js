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

Cadence.prototype.rescue = function () {
    var errors
    if (this.errors.length === 0) {
        invoke(this)
    } else {
        var error = this.errors.shift()
        var cadence = this

        execute(this.self, [
            this.catcher,
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
                cadence.errors = [ error ]
                cadence.finalize()
            } else {
                cadence.rescue()
            }
        }
    }
}

Cadence.prototype.finalize = function () {
    var vargs, cadence = this
    if (this.finalizers.length == 0) {
        if (this.errors.length === 0) {
            (this.callback).apply(null, this.vargs)
        } else {
            (this.callback).apply(null, [ this.errors[0] ])
        }
    } else {
        var finalizer = this.finalizers.pop()
        execute(cadence.self, finalizer.steps, finalizer.vargs.concat(done))
    }
    function done (error) {
        if (error) {
            cadence.errors.push(error)
        }
        cadence.finalize()
    }
}

function invoke (cadence) {
    for (;;) {
        var vargs, steps = cadence.steps

        async.self = cadence.self
        async.cadence = cadence

        if (cadence.errors.length) {
            if (cadence.catcher) {
                cadence.rescue()
            } else {
                cadence.finalize()
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
            cadence.vargs = vargs = []
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
                cadence.finalize()
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
 cadence call 1 x 1,427,310 ops/sec ±0.45% (93 runs sampled)
_cadence call 1 x 712,629 ops/sec ±0.22% (100 runs sampled)
 cadence call 2 x 1,423,094 ops/sec ±0.49% (96 runs sampled)
_cadence call 2 x 710,861 ops/sec ±0.30% (101 runs sampled)
 cadence call 3 x 1,435,402 ops/sec ±0.21% (97 runs sampled)
_cadence call 3 x 712,608 ops/sec ±0.39% (101 runs sampled)
 cadence call 4 x 1,415,863 ops/sec ±0.40% (100 runs sampled)
_cadence call 4 x 709,602 ops/sec ±0.33% (95 runs sampled)
Fastest is  cadence call 3, cadence call 1
 % node benchmark/increment/async.js
 cadence async 1 x 975,945 ops/sec ±0.26% (102 runs sampled)
_cadence async 1 x 1,161,702 ops/sec ±0.32% (101 runs sampled)
 cadence async 2 x 954,778 ops/sec ±0.50% (95 runs sampled)
_cadence async 2 x 1,159,735 ops/sec ±0.51% (100 runs sampled)
 cadence async 3 x 960,031 ops/sec ±0.29% (97 runs sampled)
_cadence async 3 x 1,152,847 ops/sec ±0.33% (100 runs sampled)
 cadence async 4 x 946,351 ops/sec ±0.52% (98 runs sampled)
_cadence async 4 x 1,168,242 ops/sec ±0.33% (102 runs sampled)
Fastest is _cadence async 4
 % node benchmark/increment/loop.js
 cadence loop 1 x 184,840 ops/sec ±0.87% (95 runs sampled)
_cadence loop 1 x 162,873 ops/sec ±0.71% (100 runs sampled)
 cadence loop 2 x 188,180 ops/sec ±0.47% (98 runs sampled)
_cadence loop 2 x 162,390 ops/sec ±0.36% (101 runs sampled)
 cadence loop 3 x 189,586 ops/sec ±0.51% (99 runs sampled)
_cadence loop 3 x 164,139 ops/sec ±0.36% (97 runs sampled)
 cadence loop 4 x 187,982 ops/sec ±0.42% (98 runs sampled)
_cadence loop 4 x 162,942 ops/sec ±0.37% (100 runs sampled)
Fastest is  cadence loop 3
 % node --version
v0.12.7
 % node benchmark/increment/call.js
 cadence call 1 x 2,527,716 ops/sec ±0.55% (97 runs sampled)
_cadence call 1 x 1,025,080 ops/sec ±0.54% (101 runs sampled)
 cadence call 2 x 2,437,420 ops/sec ±0.45% (100 runs sampled)
_cadence call 2 x 1,039,714 ops/sec ±0.46% (99 runs sampled)
 cadence call 3 x 2,556,287 ops/sec ±0.40% (98 runs sampled)
_cadence call 3 x 1,026,920 ops/sec ±0.60% (99 runs sampled)
 cadence call 4 x 2,528,288 ops/sec ±0.81% (100 runs sampled)
_cadence call 4 x 1,025,602 ops/sec ±0.37% (100 runs sampled)
Fastest is  cadence call 3
 % node benchmark/increment/async.js
 cadence async 1 x 1,900,433 ops/sec ±0.68% (98 runs sampled)
_cadence async 1 x 1,474,964 ops/sec ±0.73% (101 runs sampled)
 cadence async 2 x 1,964,361 ops/sec ±0.46% (99 runs sampled)
_cadence async 2 x 1,449,702 ops/sec ±0.47% (97 runs sampled)
 cadence async 3 x 1,926,580 ops/sec ±0.54% (96 runs sampled)
_cadence async 3 x 1,457,632 ops/sec ±0.57% (99 runs sampled)
 cadence async 4 x 1,935,882 ops/sec ±0.45% (94 runs sampled)
_cadence async 4 x 1,452,339 ops/sec ±0.19% (103 runs sampled)
Fastest is  cadence async 2
 % node benchmark/increment/loop.js
 cadence loop 1 x 144,910 ops/sec ±1.52% (88 runs sampled)
_cadence loop 1 x 98,825 ops/sec ±1.30% (95 runs sampled)
 cadence loop 2 x 110,863 ops/sec ±1.60% (90 runs sampled)
_cadence loop 2 x 82,455 ops/sec ±2.08% (87 runs sampled)
 cadence loop 3 x 94,945 ops/sec ±1.60% (82 runs sampled)
_cadence loop 3 x 64,096 ops/sec ±1.79% (84 runs sampled)
 cadence loop 4 x 75,567 ops/sec ±3.36% (83 runs sampled)
_cadence loop 4 x 68,424 ops/sec ±1.83% (87 runs sampled)
Fastest is  cadence loop 1

*/
