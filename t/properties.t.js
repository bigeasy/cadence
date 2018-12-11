require('proof')(23, prove)

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
    var six = cadence(function (async, one, two, three, four, five) {
        return [ one, two, three, four, five ]
    })
    six(1, 2, 3, 4, 5, function (error, one, two, three, four, five) {
        okay([ one, two, three, four, five ], [ 1, 2, 3, 4, 5 ], 'six arguments')
    })
    okay(six.length, 6, 'six arity')
    var seven = cadence(function (async, one, two, three, four, five, six) {
        return [ one, two, three, four, five, six ]
    })
    seven(1, 2, 3, 4, 5, 6, function (error, one, two, three, four, five, six) {
        okay([ one, two, three, four, five, six ], [ 1, 2, 3, 4, 5, 6 ], 'seven arguments')
    })
    okay(seven.length, 7, 'seven arity')
    var eight = cadence(function (async, one, two, three, four, five, six, seven) {
        return [ one, two, three, four, five, six, seven ]
    })
    eight(1, 2, 3, 4, 5, 6, 7, function (error, one, two, three, four, five, six, seven) {
        okay([ one, two, three, four, five, six, seven ], [ 1, 2, 3, 4, 5, 6, 7 ], 'eight arguments')
    })
    okay(eight.length, 8, 'eight arity')
    var nine = cadence(function (async, one, two, three, four, five, six, seven, eight) {
        return [ one, two, three, four, five, six, seven, eight ]
    })
    nine(1, 2, 3, 4, 5, 6, 7, 8, function (error, one, two, three, four, five, six, seven, eight) {
        okay([ one, two, three, four, five, six, seven, eight ], [ 1, 2, 3, 4, 5, 6, 7, 8 ], 'nine arguments')
    })
    okay(nine.length, 9, 'nine arity')
    var ten = cadence(function (async, one, two, three, four, five, six, seven, eight, nine) {
        return [ one, two, three, four, five, six, seven, eight, nine ]
    })
    ten(1, 2, 3, 4, 5, 6, 7, 8, 9, function (error, one, two, three, four, five, six, seven, eight, nine) {
        okay([ one, two, three, four, five, six, seven, eight, nine ], [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], 'ten arguments')
    })
    okay(ten.length, 10, 'ten arity')

    okay(cadence(function () {}).toString(), 'function () {}', 'to string')
}
