var ok = require('assert').ok
var cadence = require('../../redux')
var _cadence = require('../../_redux')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('sub', { minSamples: 100 })

function body (async) {
    async(function () { return 1 })
}

var m = cadence(body)

function fn () {
    m(function () {})
}

var m_ = _cadence(body)

function fn_ (deferred) {
    m_(function () {})
}

for (var i = 0; i < 4; i++) {
    suite.add({
        name: ' cadence call ' + i,
        fn: fn
    })

    suite.add({
        name: '_cadence call ' + i,
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
