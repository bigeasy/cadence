var ok = require('assert').ok
var cadence = require('../../redux')
var cadence_ = require('../../redux_')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('loop', { minSamples: 100 })

var COUNT = 1024 * 4

var m = cadence(function () { return 1 })

function inc (count, callback) {
    callback(null, count + 1)
}

var m = cadence(function (async) {
    var loop = async(function (inced) {
        if (inced == COUNT) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

function fn (deferred) {
    m(function (error, result) {
        deferred.resolve()
    })
}

var m_ = cadence_(function (async) {
    var loop = async(function (inced) {
        if (inced == COUNT) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

function fn_ (deferred) {
    m_(function (error, result) {
        deferred.resolve()
    })
}

for (var i = 1; i <= 4; i++) {
    suite.add({
        name: 'cadence_ loop ' + i,
        fn: fn_,
        defer: true
    })

    suite.add({
        name: 'cadence  loop ' + i,
        fn: fn,
        defer: true
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
