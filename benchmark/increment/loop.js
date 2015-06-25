var ok = require('assert').ok
var cadence = require('../../redux')
var _cadence = require('../../_redux')
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

function fn () {
    m(function (error, result) {
    })
}

var m_ = _cadence(function (async) {
    var loop = async(function (inced) {
        if (inced == COUNT) return [ loop, inced ]
        inc(inced, async())
    })(0)
})

function fn_ () {
    m_(function (error, result) {
    })
}

for (var i = 1; i <= 4; i++) {
    suite.add({
        name: ' cadence loop ' + i,
        fn: fn
    })

    suite.add({
        name: '_cadence loop ' + i,
        fn: fn_
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
