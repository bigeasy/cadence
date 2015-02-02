var ok = require('assert').ok
var cadence = require('..')
var minimal = require('../minimal')
var Benchmark = require('benchmark')
var async = require('async')
var streamlined = require('./loop.s._js')

var suite = new Benchmark.Suite('loops', { minSamples: 150 })

var mloop = minimal(function (async, count) {
    var loop = async(function (inced) {
        if (inced == count) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

var COUNT = 1024 * 4

function inc (count, callback) {
    callback(null, count + 1)
}

var wrapped = cadence(function (async, value) {
    return inc(value, async())
})

console.log('here')

function looper (callback) {
    function loop (error, count) {
        setImmediate(function () {
            if (count < COUNT) {
                inc(count, loop)
            } else {
                callback(null, count)
            }
        })
    }
    loop(null, 0)
}

var cloop = cadence(function (async) {
    async(function (i) {
        if (i == COUNT) return [ async, i ]
        inc(i, async())
    })(null, 0)
})

suite.add({
    name: 'cadence loop',
    fn: function (deferred) {
        cloop(function (error, count) {
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'raw loop',
    fn: function (deferred) {
        looper(function (error, count) {
                ok(count == COUNT, 'loop over cadence ok')
                deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'streamline loop',
    fn: function (deferred) {
        streamlined(COUNT, inc, function (error, count) {
            deferred.resolve()
            ok(count == COUNT, 'streamline ok')
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
        mloop(COUNT, function (error, count) {
            deferred.resolve()
            ok(count == COUNT, 'minimal ok')
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
