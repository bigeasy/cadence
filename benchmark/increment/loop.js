var ok = require('assert').ok
var minimal = require('../../minimal')
var minimal_ = require('../../minimal_')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('loop', { minSamples: 100 })

var m = minimal(function () { return 1 })

function inc (count, callback) {
    callback(null, count + 1)
}

var m = minimal(function (async) {
    var loop = async(function (inced) {
        if (inced == 1024) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

suite.add({
    name: 'minimal  loop 1',
    fn: function (deferred) {
        m(function (error, result) {
            deferred.resolve()
        })
    },
    defer: true
})

var m_ = minimal_(function (async) {
    var loop = async(function (inced) {
        if (inced == 1024) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

suite.add({
    name: 'minimal_ loop 1',
    fn: function (deferred) {
        m_(function (error, result) {
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'minimal  loop 2',
    fn: function (deferred) {
        m(function (error, result) {
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'minimal_ loop 2',
    fn: function (deferred) {
        m_(function (error, result) {
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
