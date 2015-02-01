require('proof')(1, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../../minimal')

    var f = cadence(function (async) {
        var loop = async(function (i) {
            if (i == 2) return [ loop, i ]
        })()
    })

    async(function () {
        f(async())
    }, function (result) {
        assert(result, 2, 'returned')
    }, function () {
        cadence(function (async) {
            async(function () {
                var outer = async(function (i) {
                    var inner = async(function (j) {
                        if (i == 2) return [ outer, i, j ]
                        if (j == 2) return [ inner ]
                    })()
                })()
            }, function (i, j) {
                console.log(i, j)
                return [ i, j ]
            })
        })(async())
    }, function () {
        cadence(function (async) {
            var loop = async(function (i, j) {
                console.log(j)
                if (j == 2) return [ loop, j ]
                else return j + 1
            })(0)
        })(async())
    }, function (j) {
        assert(j, 2, 'loop arguments')
    })
}

function item (number, callback) { callback(null, number) }
