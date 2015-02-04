var cadence = require('./redux')

function Sink (async, self, ee) {
    this._async = async
    this._self = self
    this._ee = ee
    this._listeners = []
    this._callback = async()
}

Sink.prototype._invoke = function (fn, vargs) {
    try {
        var ret = fn.apply(this._self, vargs)
        return [ ret ]
    } catch (e) {
        return [ ret, e ]
    }
}

Sink.prototype._register = function (event, fn) {
    this._ee.on(event, fn)
    this._listeners.push({ event: event, fn: fn })
}

Sink.prototype.error = function (filter) {
    this._register('error', function (error) {
        if (filter) {
            error = this._invoke(filter, [ error ])[1]
        }
        if (error) {
            this._terminate([ error ])
        }
    }.bind(this))
    return this
}

Sink.prototype.end = function (event) {
    this._register(event, function () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        this._terminate([ null ].concat(vargs))
    }.bind(this))
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
    this._register(event, function () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        var ret = this._invoke(listener, vargs)
        if (ret.length === 2) {
            this._terminate([ ret[1] ])
        }
    }.bind(this))
    return this
}

cadence(function (async) {
    async.ee = function (ee) {
        var async = this
        return new Sink(this, async.self, ee)
    }
})(function () {})
