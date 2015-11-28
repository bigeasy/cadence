var cadence = require('../../cadence')
var _cadence = require('../../_cadence')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('loop', { minSamples: 100 })

var COUNT = 1024

var m = cadence(function () { return 1 })

function inc (count, callback) {
    callback(null, count + 1)
}

function body (async) {
    var loop = async(function (inced) {
        if (inced == COUNT) return [ loop.break, inced ]
        inc(inced, async())
    })(0)
}

var m = cadence(body)

function fn () { m(function () {}) }

var m_ = _cadence(body)

function fn_ () { m_(function () {}) }

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
