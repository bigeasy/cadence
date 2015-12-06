var stack = [], push = [].push, token = {}

function Cadence (parent, finalizers, self, steps, vargs, callback) {
    this.parent = parent
    this.finalizers = finalizers
    this.self = self
    this.steps = steps
    this.callback = callback
    this.loop = false
    this.cadence = this
    this.cadences = []
    this.results = []
    this.errors = []
    this.called = 0
    this.index = 0
    this.sync = true
    this.waiting = false
    this.vargs = vargs
}

Cadence.prototype.resolveCallback = function (result, error, vargs) {
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

    function callback (error) {
        var I = arguments.length
        var vargs = new Array
        for (var i = 1; i < I; i++) {
            vargs[i - 1] = arguments[i]
        }
        self.resolveCallback(result, error, vargs)

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
        continue: { loopy: token, repeat: true, loop: true, cadence: this },
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

function invoke (cadence) {
    for (;;) {
        var vargs, steps = cadence.steps, fn

        async.self = cadence.self

        if (cadence.errors.length) {
            if (cadence.catcher) {
                var catcher = cadence.catcher, errors = cadence.errors
                fn = function () {
                    return catcher.call(this, errors[0], errors)
                }
            } else {
                fn = null
                cadence.loop = false
            }
        } else {
            if (cadence.results.length == 0) {
                vargs = cadence.vargs
                if (vargs[0] && vargs[0].loopy === token) {
                    var label = vargs.shift()
                    var destination = label.cadence || cadence.cadence
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
            fn = steps[cadence.index++]
        }

        if (fn == null) {
            if (cadence.finalizers.length) {
                var finalizer = cadence.finalizers.shift()
                fn = function () {
                    async(function () {
                        return finalizer.vargs
                    }, finalizer.steps[0], function () {
                        return vargs
                    })
                }
            } else if (cadence.loop) {
                fn = steps[0]
                cadence.index = 1
            } else if (cadence.errors.length) {
                (cadence.callback).apply(null, [ cadence.errors[0] ])
                break
            } else {
                if (vargs.length !== 0) {
                    vargs.unshift(null)
                }
                (cadence.callback).apply(null, vargs)
                break
            }
        }

        cadence.called = 0
        cadence.cadences = []
        cadence.results = []
        cadence.errors = []
        cadence.sync = true
        cadence.waiting = false
        cadence.catcher = null

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
            if (ret[0] !== void(0)) {
                cadence.vargs = Array.isArray(ret[0]) ? ret[0] : [ ret[0] ]
            }
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
