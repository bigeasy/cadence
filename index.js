var __slice = [].slice
var cadence = require('cadence')

function Turnstile (options) {
    this._queue = []
    this._error = options.error
    this._pause = options.pause || function (callback) { callback() }
}

Turnstile.prototype.enqueue = function () {
    var entry = {
        request: __slice.call(arguments)
    }
    this._queue.push(entry)
    if (this._queue.length == 1) {
        this._consume(function (error) {
            if (error) throw error
        })
    }
    return function (callback) {
        entry.callback = callback
    }
}

Turnstile.prototype._consume = cadence(function (step) {
    step(function () {
        setImmediate(step())
    }, [function () {
        step(function () {
            this._pause(step())
        }, function () {
            return this._queue[0]
        }, function (entry) {
            console.log(entry)
            if (!entry) step(null)
        }, function (entry) {
            var request = entry.request,
                object = request.shift(), method = request.shift()
            step(function () {
                setImmediate(step())
            }, function () {
                object[method].apply(object, request.concat(step()))
            }, function () {
                if (entry.callback) {
                    entry.callback.apply(null, [ null ].concat(__slice.call(arguments)))
                }
            })
        }, function () {
            this._queue.shift()
        })()
    }, function (errors, error) {
        try {
            var entry = this._queue.shift()
            this._error.apply(this, [ error ].concat(entry))
        } catch (thrown) {
            if (error !== thrown) {
                errors.push(thrown)
            }
            console.log(thrown)
            throw errors
        }
    }])
})

module.exports = Turnstile
