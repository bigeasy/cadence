var __slice = [].slice

function Constructor (options) {
    options = options || {}
    if (this instanceof Constructor) {
        this._options = {}
        this._options.on = options.on || 'on'
        this._options.off = options.off || 'removeListener'
        this._options.error = options.error || 'error'
    } else {
        return new Constructor(options)
    }
}

Constructor.prototype.configure = function (options) {
    return new Constructor(options)
}

Constructor.prototype.step = function (step, vargs) {
    var ee = vargs.shift(), builder = new Builder(this._options, step, ee)
    if (vargs.length) {
        builder.on.apply(builder, vargs)
    }
    return builder
}

function Builder (options, step, ee) {
    this._options = options
    this._step = step
    this._ee = ee
}

Builder.prototype.on = function () {
    var vargs = __slice.call(arguments),
        options = this._options, step = this._step, ee = this._ee,
        name, handler
    if (typeof vargs[0] == 'string') {
        name = vargs.shift()
    }
    if (vargs[0] === Error) {
        if (!name) {
            name = options.error
        }
        handler = step(Error)
    } else {
        handler = step.apply(null, [ null ].concat(vargs))
    }
    ee[options.on](name, handler)
    step([function () { ee[options.off](name, handler) }])
    return this
}

module.exports = Constructor()
