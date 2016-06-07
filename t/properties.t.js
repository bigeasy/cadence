require('proof')(9, prove)

function prove (assert) {
    var cadence = require('..')
    var two = cadence(function (async, one) {
        return [ one ]
    })
    two(1, function (error, one) {
        assert([ one ], [ 1 ], 'two arguments')
    })
    assert(two.length, 2, 'two arity')
    var three = cadence(function (async, one, two) {
        return [ one, two ]
    })
    three(1, 2, function (error, one, two) {
        assert([ one, two ], [ 1, 2 ], 'three arguments')
    })
    assert(three.length, 3, 'three arity')
    var four = cadence(function (async, one, two, three) {
        return [ one, two, three ]
    })
    four(1, 2, 3, function (error, one, two, three) {
        assert([ one, two, three ], [ 1, 2, 3 ], 'four arguments')
    })
    assert(four.length, 4, 'four arity')
    var five = cadence(function (async, one, two, three, four) {
        return [ one, two, three, four ]
    })
    five(1, 2, 3, 4, function (error, one, two, three, four) {
        assert([ one, two, three, four ], [ 1, 2, 3, 4 ], 'five arguments')
    })
    assert(five.length, 5, 'five arity')

    assert(cadence(function () {}).toString(), 'function () {}', 'to string')
}
