require('proof')(6, prove)

function prove (assert) {
    var cadence = require('../../redux')

    cadence(function () {
        throw new Error('bogus')
    })(function (error) {
        assert(error.message, 'bogus', 'thrown exception')
    })

    cadence(function (async) {
        async(function () {
            return 1
        }, [function () {
            throw new Error('bogus')
        }, function (error) {
            assert(error.message, 'bogus', 'caught')
        }])
    })(function (error, result) {
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
        }, function (error) {
            if (error.message != 'one') throw error
        }])
    })(function (error, result) {
        assert(error.message, 'two', 'propagated second error')
    })
}
