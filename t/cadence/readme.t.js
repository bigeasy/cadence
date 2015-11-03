require('proof')(2, require('../..')(prove))

function prove (async, assert) {
    var cadence = require('../..')

    function echo (value, callback) {
        setImmediate(callback, null, value)
    }

    var deepEqual = assert.deepEqual

    async(function () {
        var next = async()

        var multiply = cadence(function (async, matrix) {
            async(function () {
                var i = 0, j = 0
                async(function () {
                    if (i == matrix.length) return [ async.break ]
                    async(function () {
                        if (j == matrix[i].length) return [ async.break ]
                        echo(matrix[i][j] * 5, async())
                    }, function (value) {
                        matrix[i][j] = value
                        j++
                    })()
                }, function () {
                    j = 0
                    i++
                })()
            }, function () {
                return [ matrix ]
            })
        })

        multiply([[ 1, 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ]], function (error, matrix) {
            if (error) throw error
            deepEqual(matrix, [[ 5, 10, 15 ], [ 20, 25, 30 ], [ 35, 40, 45 ]])
            next()
        })
    }, function () {
        var next = async()

        var multiply = cadence(function (async, matrix) {
            async.map(function (array) {
                async.map(function (value) {
                    echo(value * 5, async())
                })(array)
            })(matrix)
        })

        multiply([[ 1, 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ]], function (error, matrix) {
            if (error) throw error
            deepEqual(matrix, [[ 5, 10, 15 ], [ 20, 25, 30 ], [ 35, 40, 45 ]])
            next()
        })
    })
}
