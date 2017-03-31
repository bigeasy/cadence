require('proof')(12, prove)

function prove (assert) {
    var cadence = require('..')

    cadence(function () {
        throw new Error('bogus')
    })(function (error) {
        assert(error.message, 'bogus', 'thrown exception')
    })

    var object = { a: 1 }
    cadence(function (async) {
        async(function () {
            return 1
        }, [function () {
            throw new Error('bogus')
        }, function (error) {
            assert(object === this, 'this')
            assert(error.message, 'bogus', 'caught')
        }])
    }).call(object, function (error, result) {
        assert(result, 1, 'propagate vargs')
    })

    cadence(function (async) {
        async([function () {
            throw new Error('bogus')
        }, function (error) {
            assert(error.message, 'bogus', 'caught')
            return 1
        }])
    })(function (error, result) {
        assert(result, 1, 'changed return value')
    })

    cadence(function (async) {
        async([function () {
            async()(new Error('one'))
            async()(new Error('two'))
        }, function (error, errors) {
            throw errors[1]
        }])
    })(function (error) {
        assert(error.message, 'two', 'propagated second error')
    })

    cadence(function (async) {
        async(function () {
            async()
            throw new Error('raised')
        })
    })(function (error) {
        assert(error.message, 'raised', 'do not wait on callbacks after exception')
    })

    cadence(function (async) {
        async([function () {
            throw new Error('uncaught')
        }, /^x$/, function (error) {
        }])
    })(function (error) {
        assert(error.message, 'uncaught', 'catch specification missed')
    })

    cadence(function (async) {
        async([function () {
            throw new Error('caught')
        }, /^caught$/, function (error) {
            return [ error.message ]
        }])
    })(function (error, message) {
        assert(message, 'caught', 'catch specification hit')
    })

    try {
        cadence(function () {
        })(function () {
            throw new Error('thrown')
        })
    } catch (e) {
        assert(e.message, 'thrown', 'panic')
    }

    cadence(function (async) {
        async([function () {
            throw new Error('breaker')
        }, function (error) {
            return [ async.break, 1 ]
        }], function () {
            return [ 2 ]
        })
    })(function (error, result) {
        assert(result, 1, 'break from within catch')
    })
}
