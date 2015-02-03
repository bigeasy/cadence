var cadence = require('./redux')

function variadic (f) {
    return function () {
        var I = arguments.length
        var vargs = new Array(I)
        for (var i = 0; i < I; i++) {
            vargs[i] = arguments[i]
        }
        return f.call(this, vargs)
    }
}

cadence(function (async) {
    async.forEach = variadic(function (steps) {
        var async = this
        return variadic(function (vargs) {
            var loop, array = vargs.shift(), index = -1
            steps.unshift(variadic(function (vargs) {
                index++
                if (index === array.length) return [ loop ].concat(vargs)
                return [ array[index], index ].concat(vargs)
            }))
            return loop = async.apply(null, steps).apply(null, vargs)
        })
    })
    async.map = variadic(function (steps) {
        var async = this
        return variadic(function (vargs) {
            var loop, array = vargs.shift(), index = -1, gather = []
            steps.unshift(variadic(function (vargs) {
                index++
                if (index === array.length) return [ loop, gather ]
                return [ array[index], index ].concat(vargs)
            }))
            steps.push(variadic(function (vargs) {
                gather.push.apply(gather, vargs)
            }))
            return loop = async.apply(null, steps).apply(null, vargs)
        })
    })
})(function () {})
