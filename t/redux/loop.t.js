require('proof')(4, prove)

function prove (assert) {
    var cadence = require('../../redux')

    var f = cadence(function (async) {
        var i = 0, loop = async(function () {
            if (++i == 2) return [ loop, i ]
        })()
    })(function (error, result) {
        assert(result, 2, 'returned')
    })

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
            return [ i, j ]
        })
    })(function (error, i, j) {
        assert([ i, j ], [ 2, 0 ], 'break outer')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i == 2) return [ loop, i ]
            else return i + 1
        })(0)
    })(function (error, i) {
        assert(i, 2, 'loop arguments')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i % 2 == 0) return [ loop(), i + 1 ]
            else return [ i ]
        }, function (i) {
            return [ loop, i ]
        })(0)
    })(function (error, i) {
        assert(i, 1, 'continued')
    })
}

function item (number, callback) { callback(null, number) }
