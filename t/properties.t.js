require('proof')(13, prove)

function prove (okay) {
    var cadence = require('..')
    var zero = cadence(function () {
        return [ arguments[1] ]
    })
    zero(1, function (error, one) {
        okay([ one ], [ 1 ], 'zero single argument')
    })
    okay(zero.length, 0, 'zero arity')
    var one = cadence(function (async) {
        return [ arguments[1] ]
    })
    one(1, function (error, one) {
        okay([ one ], [ 1 ], 'one single argument')
    })
    okay(one.length, 1, 'one arity')
    var two = cadence(function (async, one) {
        return [ one ]
    })
    two(1, function (error, one) {
        okay([ one ], [ 1 ], 'two arguments')
    })
    okay(two.length, 2, 'two arity')
    var three = cadence(function (async, one, two) {
        return [ one, two ]
    })
    three(1, 2, function (error, one, two) {
        okay([ one, two ], [ 1, 2 ], 'three arguments')
    })
    okay(three.length, 3, 'three arity')
    var four = cadence(function (async, one, two, three) {
        return [ one, two, three ]
    })
    four(1, 2, 3, function (error, one, two, three) {
        okay([ one, two, three ], [ 1, 2, 3 ], 'four arguments')
    })
    okay(four.length, 4, 'four arity')
    var five = cadence(function (async, one, two, three, four) {
        return [ one, two, three, four ]
    })
    five(1, 2, 3, 4, function (error, one, two, three, four) {
        okay([ one, two, three, four ], [ 1, 2, 3, 4 ], 'five arguments')
    })
    okay(five.length, 5, 'five arity')

    okay(cadence(function () {}).toString(), 'function () {}', 'to string')
}
