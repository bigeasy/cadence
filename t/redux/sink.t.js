require('proof')(4, prove)

function prove (assert) {
    var cadence = require('../../redux')
    require('../../ee')
    var events = require('events')

    var ee = new events.EventEmitter

    var f = cadence(function (async) {
        async.ee(ee).end('end')
                    .on('data', function (data) {
                        if (data == 2) {
                            throw new Error('data')
                        }
                    })
                    .error(function (error) {
                        if (error.message != 'catch') {
                            throw error
                        }
                    })
    })

    f(function (error, number) {
        if (error) throw error
        assert(number, 1, 'end')
    })

    ee.emit('error', new Error('catch'))
    ee.emit('end', 1)

    f(function (error) {
        assert(error.message, 'rethrow', 'thrown')
    })

    ee.emit('error', new Error('rethrow'))

    f(function (error) {
        assert(error.message, 'data', 'thrown')
    })

    ee.emit('data', 1)
    ee.emit('data', 2)

    var e = cadence(function (async) {
        async.ee(ee).error()
    })

    e(function (error) {
        assert(error.message, 'catch', 'basic error')
    })

    ee.emit('error', new Error('catch'))
}
