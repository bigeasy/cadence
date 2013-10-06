var domain = require('domain')
var __slice = [].slice

module.exports = function () {
    var steps = __slice.call(arguments)

    return function () {
        var vargs = __slice.call(arguments)
        var step = vargs[0]

        var self = this

        var _steps = steps.slice()
        var first = steps[0]

        _steps[0] = function () {
            first.apply(self, vargs)
        }

        var d = domain.create()
        d.run(function () {
            step.apply(self, _steps)(1)
        })
        d.on('error', step(Error))
    }
}
