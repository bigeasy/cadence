#!/usr/bin/env node

require('proof')(25, require('../..')(function (async, assert) {
    var cadence = require('../..')

    function counter (count, callback) {
        callback(null, count < 3)
    }

    cadence(function (async) {
        var count = 0
        async(function () {
            count++
        }, function () {
            if (count == 10) return [ async, count ]
        })()
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'loop')
    })

    cadence(function (async) {
        var count = 0
        async(function (more) {
            if (!more) return [ async, count ]
        }, function () {
            async()(null, ++count < 10)
        })(null, true)
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'initialized loop')
    })

    cadence(function (async) {
        var count = 0
        var starter = async(function () {
            count++
        }, function () {
            if (count == 10) return [ async, count ]
        })
        starter()
        starter()
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'double start loop')
    })

    cadence(function (async) {
        var count = 0
        async(function () {
            return ++count
        })(10)
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'counted loop')
    })

    cadence(function (async) {
        var outer = { count: 0, flag: true }
        async(function (count, flag) {
            assert(flag, outer.flag, 'got flag in counted loop ' + (count + 1))
            assert(count, outer.count++, 'got count in counted loop' + (count + 1))
            outer.flag = false
            return false
        })(2, true)
    })(function (error, result) {
        if (error) throw error
        assert(result, false, 'counted loop with argument')
    })

    cadence(function (async) {
        var sum = 0, count = 0
        async(function (number, index) {
            assert(index, count++, 'reduced each loop index ' + index)
            async()(null, sum = sum + number)
        })([ 1, 2, 3, 4 ])
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'reduced each loop')
    })

    cadence(function (async) {
        var sum = 0, count = 0
        async(function (array, index) {
            assert(index, count++, 'reduced each loop of arrays index ' + index)
            async()(null, sum = sum + array[0])
        })([ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ])
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'reduced each loop of arrays')
    })

    function echo (value, callback) {
        callback(null, value)
    }

    async(function () {
        cadence(function (async) {
            var count = 0
            async(function (number) {
                echo(++count, async())
            })([], 4)
        })(async())
    }, function (result) {
        assert(result, [ 1, 2, 3, 4 ], 'gathered counted loop')
    })

    async(function () {
        cadence(function (async) {
            var sum = 0
            async(function (number) {
                async()(null, sum = sum + number)
            })([], [ 1, 2, 3, 4 ])
        })(async())
    }, function (result) {
        assert(result, [ 1, 3, 6, 10 ], 'gathered each loop')
    })

    cadence(function (async) {
        var retry = async([function () {
            async(retry)(null, 1)
        }, function () {
            throw new Error('should not be thrown')
        }])(1)
    })(function (error, result) {
        if (error) throw error
        assert(result, 1, 'loop break callbacked')
    })

    cadence(function (async) {
        var count = 0
        var retry = async([function (_, retry) {
            if (retry) count++
            if (count != 10) throw new Error('x')
            else return [ async, 10 ]
        }, function () {
            async(retry(), 1)(null, true)
        }])(1)
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'loop continue callbacked')
    })

    cadence(function (async) {
        var count = 0
        var retry = async([function (_, retry) {
            if (retry) count++
            if (count != 10) throw new Error
            else return [ async, 10 ]
        }, function () {
            return [ retry(), true ]
        }])(1)
    })(function (error, result) {
        if (error) throw error
        assert(result, 10, 'loop continue return')
    })

    cadence(function (async) {
        var count = 0
        var outer = async(function () {
            return 1
        }, function (value) {
            var inner = async(function () {
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
        assert([ one, two ], [ 1, 2 ], 'jump out')
    })
}))
