#!/usr/bin/env node

require('proof')(12, function (step, assert) {
    var cadence = require('../..')

    cadence(function (step) {

        var arrays = step([])
        arrays()(null, 'a', 1)
        arrays()(null, 'b', 2)
        arrays()(null, 'c', 3)

    }, function (letters, numbers) {

        assert(letters[0], 'a', 'letter one')
        assert(letters[1], 'b', 'letter two')
        assert(letters[2], 'c', 'letter three')

        assert(numbers[0], 1, 'number one')
        assert(numbers[1], 2, 'number two')
        assert(numbers[2], 3, 'number three')

    })(step())

    // **TODO**: Undone.
    cadence(function (step) {
        var array = step([])

        var first = array()

        array()(null)
        array()(null, 'b', 2)

        first(null, 'a')

    }, function (letters, numbers) {

        assert(letters.length, 3, 'some undefineds letters count')
        assert(letters.length, 3, 'some undefineds numbers count')

        assert(letters[0], 'a', 'some undefines letter one')
        assert(letters[2], 'b', 'some undefines letter two')

        assert(numbers[0] === undefined, 'some undefines numbers one')
        assert(numbers[2], 2, 'some undefines numbers two')

    })()
})
