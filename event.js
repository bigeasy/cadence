var __slice = [].slice

function Constructor (options) {
    options = options || {}
    if (this instanceof Constructor) {
        this._on = options.on || 'on'
        this._off = options.off || 'removeListener'
        this._error = options.error || 'error'
    } else {
        return new Constructor(options)
    }
}

Constructor.prototype.configure = function (options) {
    return new Constructor(options)
}

Constructor.prototype.step = function (step, vargs) {
    var ee = vargs.shift(), builder = new Builder(step, ee)
    if (vargs.length) {
        builder.on.apply(builder, vargs)
    }
    return builder
}

function Builder (step, ee) {
    this._step = step
    this._ee = ee
}

Builder.prototype.on = function () {
    var vargs = __slice.call(arguments), step = this._step, name
    if (typeof vargs[0] == 'string') {
        name = vargs.shift()
    }
    if (vargs[0] === Error) {
        if (!name) {
            name = this._error
        }
        this._ee.on(name, step(Error))
    } else {
        this._ee.on(name, step.apply(null, [ null ].concat(vargs)))
    }
    return this
}

module.exports = Constructor()
