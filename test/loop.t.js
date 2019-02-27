require('proof')(18, prove)

function prove (okay) {
    var cadence = require('..')

    // Don't ever actually do this. Continuing at the base will cause the root
    // cadence to run but with the arguments given to continue.
    cadence(function (async) {
        if (async == null) {
            return [ 1 ]
        }
        async(function () {
            return [ async.continue ]
        })
    })(0, function (error, result) {
        okay(result, 1, 'continue at root')
    })

    cadence(function (async) {
        async(function () {
            return [ async.break, 1 ]
        })
    })(0, function (error, result) {
        okay(result, 1, 'break at root')
    })

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
        var i = 0, loop = async.loop([], function () {
            if (++i == 2) return [ loop.break, i ]
        })
    })(function (error, result) {
        okay(result, 2, 'returned')
    })

    cadence(function (async) {
        var i = 0
        async.loop([], function () {
            async(function () {
                if (++i == 2) return [ async.break, i ]
            })
        })
    })(function (error, result) {
        okay(result, 2, 'returned no label')
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

    cadence(function (async) {
        var loop = async.loop([ 0 ], function (i) {
            if (i == 2) return [ loop.break, i ]
            else return i + 1
        })
    })(function (error, i) {
        okay(i, 2, 'loop arguments')
    })

    cadence(function (async) {
        var loop = async.loop([ 0 ], function (i) {
            if (i % 2 == 0) return [ loop.continue, i + 1 ]
            else return [ i ]
        }, function (i) {
            return [ loop.break, i ]
        })
    })(function (error, i) {
        okay(i, 1, 'continued')
    })

    cadence(function (async) {
        async.loop([ 0 ], function (i) {
            async(function () {
                if (i % 2 == 0) return [ async.continue, i + 1 ]
                else return [ i ]
            })
        }, function (i) {
            return [ async.break, i ]
        })
    })(function (error, i) {
        okay(i, 1, 'continued no label')
    })

    cadence(function (async) {
        async.loop([], function () {
            async([function () {
                throw new Error
            }, function (error) {
                return [ async.break, 0 ]
            }])
        }, function () {
            throw new Error('should not happen')
        })
    })(function (error, i) {
        okay(error == null, 'no error')
        okay(i, 0, 'break no label')
    })

    cadence(function (async) {
        async.loop([], function () {
            async.loop([], [function () {
                throw new Error
            }, function (error) {
                return [ async.break, 0 ]
            }])     // <- this is what is different from above, I expect loop to
                    // async.break from the inner-most.
        }, function (value) {
            return [ async.break, value + 1 ]
        })
    })(function (error, i) {
        okay(error == null, 'no error')
        okay(i, 1, 'break inner no label')
    })

    cadence(function (async) {
        var loop = async.loop([ 0 ], function (i) {
            if (i == 0) return [ loop.continue, i + 1 ]
            else return [ loop.break, i + 1 ]
        })
    })(function (error, i) {
        okay(i, 2, 'continue then break')
    })

    cadence(function (async) {
        async.loop([ 0 ], function (value) {
            if (value == 1) {
                return [ async.break ]
            }
            async(function () {
                async(function () {
                    return [ async.return, 1 ]
                }, function () {
                    throw new Error
                })
            }, function (value) {
                okay(value, 1, 'returned')
            })
        })
    })(function (error) {
        if (error) throw error
    })

    cadence(function (async) {
        async(function () {
            async.block(function () {
                return 1
            })
        }, function (value) {
            okay(value, 1, 'block end')
            async.block(function () {
                async(function () {
                    return [ async.break, 2 ]
                })
            }, function () {
                throw new Error
            })
        }, function (value) {
            okay(value, 2, 'block async break')
            var block = async.block(function () {
                async.loop([], function () {
                    return [ block.break, 3 ]
                }, function () {
                    throw new Error
                })
            }, function () {
                throw new Error
            })
        }, function (value) {
            okay(value, 3, 'block label break')
        })
    })(function (error) {
        if (error) throw error
    })

}

function item (number, callback) { callback(null, number) }
