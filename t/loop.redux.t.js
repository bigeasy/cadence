require('proof')(7, prove)

function prove (okay) {
    var cadence = require('..')

    cadence(function (async) {
        var i = 0
        async.loop([], function () {
            if (++i == 2) return [ async.break, i ]
            else return [ async.continue ]
        })
    })(function (error, result) {
        okay(result, 2, 'async break and continue')
    })

    cadence(function (async) {
        var i = 0
        async.loop([], function () {
            if (++i == 2) return [ async.break, i ]
        })
    })(function (error, result) {
        okay(result, 2, 'returned')
    })

    cadence(function (async) {
        var i = 0
        var loop = async.loop([], function () {
            if (++i == 2) return [ loop.break, i ]
        })
    })(function (error, result) {
        okay(result, 2, 'labeled')
    })

    cadence(function (async) {
        async.loop([ 0 ], function (i) {
            if (i == 2) return [ async.break, i ]
            else return [ i + 1 ]
        })
    })(function (error, result) {
        okay(result, 2, 'primed')
    })

    cadence(function (async) {
        var i = 0
        async.loop([], function () {
            async(function () {
                if (++i == 2) return [ async.break, i ]
            })
        })
    })(function (error, result) {
        okay(result, 2, 'nested break')
    })

    cadence(function (async) {
        var i = 0
        var loop = async.loop([], function () {
            async(function () {
                if (++i == 2) return [ loop.break, i ]
            })
        })
    })(function (error, result) {
        okay(result, 2, 'nested labeled break')
    })

    cadence(function (async) {
        async(function () {
            var i = 0, outer = async.loop([], function () {
                var j = 0, inner = async.loop([], function () {
                    if (i == 2) return [ outer.break, i, j ]
                    if (j++ == 2) return [ inner.break ]
                })
                i++
            })
        }, function (i, j) {
            return [ i, j ]
        })
    })(function (error, i, j) {
        okay([ i, j ], [ 2, 0 ], 'break outer')
    })

    return

    cadence(function (async) {
        var loop = async(function (i) {
            if (i == 2) return [ loop.break, i ]
            else return i + 1
        })(0)
    })(function (error, i) {
        okay(i, 2, 'loop arguments')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i % 2 == 0) return [ loop.continue, i + 1 ]
            else return [ i ]
        }, function (i) {
            return [ loop.break, i ]
        })(0)
    })(function (error, i) {
        okay(i, 1, 'continued')
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
        okay(i, 1, 'continued no label')
    })

    cadence(function (async) {
        var loop = async(function (i) {
            if (i == 0) return [ loop.continue, i + 1 ]
            else return [ loop.break, i + 1 ]
        })(0)
    })(function (error, i) {
        okay(i, 2, 'continue then break')
    })
}

function item (number, callback) { callback(null, number) }
