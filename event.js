var __slice = [].slice

function Builder (step, ee) {
    if (this instanceof Builder) {
        this.step = step
        this.ee = ee
    } else {
        return new Builder(step, ee)
    }
}

Builder.protoype.on = function () {
    var step = this.step, ee = this.ee,
        vargs = __slice.call(arguments), name

    if (typeof vargs[0] == 'string') {
        name = vargs.shift()
    }

    if (vargs[0] instanceof Error) {
        if (!name) name = 'error'
        callback = step(0, [])
    } else {
        callback = step.apply(null, [])
    }

    step([function () { }])

    step(step, [function () { ee.removeListener(listener) }])

    array.forEach(step([], function () {
    }))

    step(step(function () {
    }))

    return this

    function listener () {
        callback.call([ null ].concat(__slice.call(arguments))
    }
}

module.exports = Builder
