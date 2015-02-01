require('proof')(2, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../../minimal')

    var f = cadence(function (async) {
        var i = 0, loop = async(function () {
            if (++i == 2) return [ loop, i ]
        })()
    })

    async(function () {
        f(async())
    }, function (result) {
        assert(result, 2, 'returned')
    }, function () {
        cadence(function (async) {
            async(function () {
                var i = 0, outer = async(function () {
                    var j = 0, inner = async(function () {
                        if (i == 2) return [ outer, i, j ]
                        if (j++ == 2) return [ inner ]
                    })()
                    i++
                })()
            }, function (i, j) {
                console.log(i, j)
                return [ i, j ]
            })
        })(async())
    }, function () {
        cadence(function (async) {
            var loop = async(function (i) {
                if (i == 2) return [ loop, i ]
                else return i + 1
            })(0)
        })(async())
    }, function (i) {
        assert(i, 2, 'loop arguments')
    })
}

function item (number, callback) { callback(null, number) }
