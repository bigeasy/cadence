require('proof')(1, prove)

function prove (okay, callback) {
    var cadence = require('..')

    cadence(function (step) {
        step(function () {
            return Promise.resolve(1)
        }, function (one) {
            step([function () {
                return Promise.reject(new Error('message'))
            }, function (error) {
                return [ one, error.message ]
            }])
        })
    }) (function (error, number, message) {
        okay({
            number,
            message
        }, {
            number: 1,
            message: 'message'
        }, 'promises')
        callback()
    })
}
