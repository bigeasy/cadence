#!/usr/bin/env node

require('proof')(26, function (step, equal, deepEqual) {
    var cadence = require('../..')

    cadence(function (step) {
        step(function () {})('bad')
    })(function (error, result) {
        equal(error.message, 'invalid arguments', 'invalid arguments')
    })

    function counter (count, callback) {
        callback(null, count < 3)
    }

    cadence(function (step) {
        var count = 0
        step(function () {
            count++
        }, function () {
            if (count == 10) step(null, count)
        })()
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'loop')
    })

    cadence(function (step) {
        var count = 0
        step(function (more) {
            if (!more) step(null, count)
        }, function () {
            step()(null, ++count < 10)
        })(null, true)
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'initialized loop')
    })

    cadence(function (step) {
        var count = 0
        var starter = step(function () {
            count++
        }, function () {
            if (count == 10) step(null, count)
        })
        starter()
        starter()
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'double start loop')
    })

    cadence(function (step) {
        var count = 0
        step(function () {
            return ++count
        })(10)
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'counted loop')
    })

    cadence(function (step) {
        var outer = { count: 0, flag: true }
        step(function (count, flag) {
            equal(flag, outer.flag, 'got flag in counted loop ' + (count + 1))
            equal(count, outer.count++, 'got count in counted loop' + (count + 1))
            outer.flag = false
            return false
        })(2, true)
    })(function (error, result) {
        if (error) throw error
        equal(result, false, 'counted loop with argumet')
    })

    cadence(function (step) {
        var sum = 0, count = 0
        step(function (number, index) {
            equal(index, count++, 'reduced each loop index ' + index)
            step()(null, sum = sum + number)
        })([ 1, 2, 3, 4 ])
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'reduced each loop')
    })

    cadence(function (step) {
        var sum = 0, count = 0
        step(function (array, index) {
            equal(index, count++, 'reduced each loop of arrays index ' + index)
            step()(null, sum = sum + array[0])
        })([ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ])
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'reduced each loop of arrays')
    })

    function echo (value, callback) {
        setImmediate(function () { callback(null, value) })
    }

    step(function () {
        cadence(function (step) {
            var count = 0
            step(function (number) {
                echo(++count, step())
            })([], 4)
        })(step())
    }, function (result) {
        deepEqual(result, [ 1, 2, 3, 4 ], 'gathered counted loop')
    })

    step(function () {
        cadence(function (step) {
            var sum = 0
            step(function (number) {
                step()(null, sum = sum + number)
            })([], [ 1, 2, 3, 4 ])
        })(step())
    }, function (result) {
        deepEqual(result, [ 1, 3, 6, 10 ], 'gathered each loop')
    })

    cadence(function (step) {
        var retry = step([function () {
            step(retry)(null, 1)
        }, function () {
            throw new Error('should not be thrown')
        }])(1)
    })(function (error, result) {
        if (error) throw error
        equal(result, 1, 'loop break callbacked')
    })

    cadence(function (step) {
        var count = 0
        var retry = step([function (_, retry) {
            if (retry) count++
            if (count != 10) throw new Error
            else step(null, 10)
        }, function () {
            step(retry(), 1)(null, true)
        }])(1)
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'loop continue callbacked')
    })

    cadence(function (step) {
        var count = 0
        var retry = step([function (_, retry) {
            if (retry) count++
            if (count != 10) throw new Error
            else step(null, 10)
        }, function () {
            return [ retry(), true ]
        }])(1)
    })(function (error, result) {
        if (error) throw error
        equal(result, 10, 'loop continue return')
    })

    cadence(function (step) {
        var count = 0
        var outer = step(function () {
            return 1
        }, function (value) {
            var inner = step(function () {
                return [ value, 2 ]
            }, function (one, two) {
                return [ outer, one, two ]
            }, function () {
                throw new Error('should not be thrown')
            })(1)
        }, function (one, two) {
            return [ one, two ]
        })(1)
    })(function (error, one, two) {
        if (error) throw error
        deepEqual([ one, two ], [ 1, 2 ], 'jump out')
    })
})
