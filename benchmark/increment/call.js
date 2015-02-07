var ok = require('assert').ok
var cadence = require('../../redux')
var _cadence = require('../../_redux')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('call', { /*minSamples: 100*/ })

var m = redux(function () { return 1 })

function fn (deferred) {
    m(function (error, result) {
        ok(result == 1, 'callback')
    })
}

var m_ = redux_(function () { return 1 })

function fn_ (deferred) {
    m_(function (error, result) {
        ok(result == 1, 'callback')
    })
}

for (var i = 0; i < 3; i++)  {
    suite.add({
        name: '_cadence call ' + i,
        fn: fn_
    })

    suite.add({
        name: ' cadence call ' + i,
        fn: fn
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
