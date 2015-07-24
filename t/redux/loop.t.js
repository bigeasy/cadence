require('proof')(8, prove)

function prove (assert) {
    var cadence = require('../../redux')

    try {
        cadence(function (async) {
            var loop = async(function () {
                return [ loop ]
            })()
        })(function (error, result) {
            if (error) throw error
        })
    } catch (error) {
        assert(error.message, 'deprecated: use `label.break`.', 'deprecated use of label to break')
    }

    try {
        cadence(function (async) {
            var loop = async(function () {
                return [ loop() ]
            })()
        })(function (error, result) {
            if (error) throw error
        })
    } catch (error) {
        assert(error.message, 'deprecated: use `label.continue`.', 'deprecated use of label to continue')
    }

    cadence(function (async) {
        var i = 0
        async(function () {
            if (++i == 2) return [ async.break, i ]
            else return [ async.continue ]
        })
    })(function (error, result) {
        if (error) throw error
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
        var loop = async(function (i) {
            if (i == 0) return [ loop.continue, i + 1 ]
            else return [ loop.break, i + 1 ]
        })(0)
    })(function (error, i) {
        assert(i, 2, 'continue then break')
    })
}

function item (number, callback) { callback(null, number) }
