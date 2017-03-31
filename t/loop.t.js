require('proof')(8, prove)

function prove (assert) {
    var cadence = require('..')

    cadence(function (async) {
        var i = 0
        async(function () {
            if (++i == 2) return [ async.break, i ]
            else return [ async.continue ]
        })
    })(function (error, result) {
        assert(result, 2, 'async break and continue')
    })

    cadence(function (async) {
        var i = 0, loop = async(function () {
            if (++i == 2) return [ loop.break, i ]
        })()
    })(function (error, result) {
        assert(result, 2, 'returned')
    })

    cadence(function (async) {
        var i = 0
        async(function () {
            async(function () {
                if (++i == 2) return [ async.break, i ]
            })
        })()
    })(function (error, result) {
        assert(result, 2, 'returned no label')
    })

    cadence(function (async) {
        async(function () {
            var i = 0, outer = async(function () {
                var j = 0, inner = async(function () {
                    if (i == 2) return [ outer.break, i, j ]
                    if (j++ == 2) return [ inner.break ]
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
            if (i == 2) return [ loop.break, i ]
            else return i + 1
        })(0)
    })(function (error, i) {
        assert(i, 2, 'loop arguments')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i % 2 == 0) return [ loop.continue, i + 1 ]
            else return [ i ]
        }, function (i) {
            return [ loop.break, i ]
        })(0)
    })(function (error, i) {
        assert(i, 1, 'continued')
    })

    cadence(function (async) {
        async(function (i) {
            async(function () {
                if (i % 2 == 0) return [ async.continue, i + 1 ]
                else return [ i ]
            })
        }, function (i) {
            return [ async.break, i ]
        })(0)
    })(function (error, i) {
        assert(i, 1, 'continued no label')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i == 0) return [ loop.continue, i + 1 ]
            else return [ loop.break, i + 1 ]
        })(0)
    })(function (error, i) {
        assert(i, 2, 'continue then break')
    })
}

function item (number, callback) { callback(null, number) }
