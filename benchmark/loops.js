var ok = require('assert').ok
var cadence = require('..')
var minimal = require('../minimal')
var Benchmark = require('benchmark')
var async = require('async')
var streamlined = require('./loop.s._js')

var suite = new Benchmark.Suite

var mloop = minimal(function (async) {
    var loop = async(function (i, inced) {
        if (inced == 256) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

minimal(function (async) {
    var loop = async(function (i) {
        if (i == 100) return [ loop ]
        mloop(async())
    })(0)
})(function () {})

var loop = cadence(function (async) {
    var count = 0
    async(function () {
        var loop = async(function () {
            async(function () {
                inc(count, async())
            }, function (inced) {
                count = inced
                if (count == 256 * 10) return [ loop ]
            })
        })()
    }, function () {
        return [ count ]
    })
})

loop(function (error, count) {
    if (error) throw error
    console.log(count)
})

var COUNT = 256

function inc (count, callback) {
    callback(null, count + 1)
}

var wrapped = cadence(function (async, value) {
    return inc(value, async())
})

suite.add({
    name: 'raw loop',
    fn: function (deferred) {
        function l (error, count) {
            if (count < COUNT) {
                inc(count, loop)
            } else {
                ok(count == COUNT, 'loop over cadence ok')
                deferred.resolve()
            }
        }
        function loop (error, count) {
            (function () {
                var args = Array.prototype.slice.call(arguments)
                l.apply(null, args)
            })(error, count)
        }
        loop(null, 0)
    },
    defer: true
})

suite.add({
    name: 'cadnece raw loop',
    fn: function (deferred) {
        function loop (error, count) {
            if (count < COUNT) {
                wrapped(count, loop)
            } else {
                ok(count == COUNT, 'loop over cadence ok')
                deferred.resolve()
            }
        }
        loop(null, 0)
    },
    defer: true
})

suite.add({
    name: 'streamline loop',
    fn: function (deferred) {
        streamlined(COUNT, inc, function (error, count) {
            if (error) throw error
            ok(count == COUNT, 'streamline ok')
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'async loop',
    fn: function (deferred) {
        var count = 0
        async.whilst(function () {
            return count < COUNT
        }, function (callback) {
            inc(count, function (error, result) {
                count = result
                setImmediate(callback)
            })
        }, function (err) {
            deferred.resolve()
            ok(count == COUNT, 'async ok')
        })
    },
    defer: true
})

suite.add({
    name: 'minimal loop',
    fn: function (deferred) {
        mloop(function (error, count) {
            if (error) throw error
            ok(count == COUNT, 'cadence ok')
            deferred.resolve()
        })
    },
    defer: true
})

var cloop = cadence(function (async) {
    async(function (i) { inc(i, async()) })(256)
})

suite.add({
    name: 'cadence loop',
    fn: function (deferred) {
        cloop(function (error, count) {
            if (error) throw error
         //   ok(count == COUNT, 'cadence ok')
            deferred.resolve()
        })
    },
    defer: true
})

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
