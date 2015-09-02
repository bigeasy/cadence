require('proof')(1, prove)

function prove (assert) {
    var cadence = require('../..')
    var events = require('events')
    cadence(function (async) {
        async.ee(new events.EventEmitter)
    })(function (error) {
        assert(error.message, 'deprecated: use `Delta`.', 'deprecated')
    })
}
