require('proof')(1, prove)

function prove (assert) {
    var cadence = require('../..')

    var o = {}
    cadence(function (async) {
        assert(async.self === o, 'self')
    }).call(o, function () {})
}
