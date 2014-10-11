#!/usr/bin/env node

require('proof')(15, require('../..')(function (async, assert) {
    var cadence = require('../..')

    cadence(function (async) {

        async(function () {
            async()(null)
            async()(null, 1)
        }, function (x) {
            assert(x, 1, 'default is zero')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            async(function () {
                async()(null, 1, 2)
            })
        }, function (one, two) {
            assert(one, 1, 'sub-cadence inferred one')
            assert(two, 2, 'sub-cadence inferred two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            async(1, function () {
                async()(null, 1, 2)
            })
            async()(null, 3)
        }, function (one, two) {
            assert(one, 1, 'sub-cadence specified one')
            assert(two, 3, 'sub-cadence specified two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            ; [ 1, 2, 3 ].forEach(async([], function (number) {
                async()(null, number, number + 1)
            }))
        }, function (one, two) {
            assert(one, [ 1, 2, 3 ], 'arrayed sub-cadence inferred one')
            assert(two, [ 2, 3, 4 ], 'arrayed sub-cadence inferred two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            [ 1, 2, 3 ].forEach(async(1, [], function (number) {
                async()(null, number, number + 1)
            }))
            async(1)(null, 2)
        }, function (one, two) {
            assert(one, [ 1, 2, 3 ], 'arrayed sub-cadence specified one')
            assert(two, 2, 'arrayed sub-cadence specified two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            var items = async([])
            ; [ 1, 2, 3 ].forEach(function (number) {
                items()(null, number, number + 1)
            })
        }, function (one, two) {
            assert(one, [ 1, 2, 3 ], 'arrayed inferred one')
            assert(two, [ 2, 3, 4 ], 'arrayed inferred two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            var items = async(1, [])
            ; [ 1, 2, 3 ].forEach(function (number) {
                items()(null, number, number + 1)
            })
            async()(null, 2)
        }, function (one, two) {
            assert(one, [ 1, 2, 3 ], 'arrayed inferred one')
            assert(two, 2, 'arrayed specified two')
        })

    })(async())

    cadence(function (async) {

        async(function () {
            async(async)(1, function (numbers) {
                numbers.forEach(async(1, [], function (number) {
                    async()(null, number, number + 1)
                }))
            })(null, [ 1, 2, 3 ])
            async(async)(function (number) { return number + 1 })(null, 2)
        }, function (one, two) {
            assert(one, [ 1, 2, 3 ], 'fixed-up inferred one')
            assert(two, 3, 'fixed-up specified two')
        })

    })(async())
}))
