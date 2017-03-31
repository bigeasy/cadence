require('proof')(2, require('..')(prove))

// Beware: The test below is not Proof as I'd use it in any other program. Here
// I'm using Proof to test examples of Cadence that are meant to be stand alone
// programs. Because of this, each step is entirely stand alone, dupcliating
// invocations to Cadence, holding onto generated callbacks, and doing a lot of
// strange stuff. Have a look at any other Proof test for a better notion of how
// to use Proof.
function prove (async, assert) {
    var cadence = require('..')

    function echo (value, callback) {
        setImmediate(callback, null, value)
    }

    async(function () {
        var next = async()
        var fs = require('fs')

        // `cat`: write a file to a stream.
        var cat = cadence(function (async, file, stream) {
                                 // ^^^^^ our universal builder function.
            async(function () {
         //       ^^^^^^^^ create a cadence of one or more steps.
                fs.readFile(file, 'utf8', async())
                                       // ^^^^^^^ create a callback.
            }, function (body) {
                      // ^^^^ the result is passed to the next step.
                stream.write(body)

            })
        })

        cat(__filename, process.stdout, function (error) {
                                               // ^^^^^ any error, anywhere inside `cat` is propagated out
            if (error) throw error
            next()
        })
    }, function () {
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
            assert(matrix, [[ 5, 10, 15 ], [ 20, 25, 30 ], [ 35, 40, 45 ]])
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
            assert(matrix, [[ 5, 10, 15 ], [ 20, 25, 30 ], [ 35, 40, 45 ]])
            next()
        })
    })
}
