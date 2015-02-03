require('proof')(1, prove)

function prove (assert) {
    var cadence = require('../../redux')

    cadence(function (async) {
        var first = async()
        var second = async()
        second(null, 3)
        first(null, 1, 2)
    })(function (error, one, two, three) {
        if (error) throw error
        assert([ one, two, three ], [ 1, 2, 3 ], 'parallel')
    })
}
