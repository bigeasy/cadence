require('proof')(1, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../../minimal')

    async(function () {
        cadence(function () { return 1 })(async())
    }, function (one) {
        assert(one, 1, 'minimal')
    })
}
