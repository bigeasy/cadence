require('proof')(1, prove)

function prove (okay) {
    var cadence = require('..')

    cadence(function () { return 1 })(function (error, one) {
        if (error) throw error
        okay(one, 1, 'minimal')
    })
}
