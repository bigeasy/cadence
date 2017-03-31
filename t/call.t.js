require('proof')(1, prove)

function prove (assert) {
    var cadence = require('..')

    cadence(function () { return 1 })(function (error, one) {
        if (error) throw error
        assert(one, 1, 'minimal')
    })
}
