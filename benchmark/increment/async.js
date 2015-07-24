var ok = require('assert').ok
var cadence = require('../../redux')
var cadence_ = require('../../_redux')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('async', { /*minSamples: 100*/ })

function body (async) { async()(null, 1) }

var m = cadence(body)

function fn () {
    m(function () {})
}

var m_ = cadence_(body)

function fn_ () {
    m_(function () {})
}

for (var i = 0; i < 4; i++)  {
    suite.add({
        name: ' cadence async ' + i,
        fn: fn
    })

    suite.add({
        name: '_cadence async ' + i,
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
