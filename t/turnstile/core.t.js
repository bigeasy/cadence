require('proof')(1, function (step, equal) {
    var Turnstile = require('../..')
    var callback
    var turnstile = new Turnstile({
        error: function (error, object, method) {
            throw error
        }
    })
    var object = {
        echo: function (value, callback) {
        console.log('here')
            equal(value, 1, 'called')
            callback(null, value)
        }
    }
    step(function () {
        turnstile.enqueue(object, 'echo', 1)(step())
    }, function (value) {
        console.log('x', value)
    })
})
