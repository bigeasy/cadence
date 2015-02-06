var ok = require('assert').ok
var redux = require('../../redux')
var redux_ = require('../../redux_')
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
        name: 'redux_ call ' + i,
        fn: fn_
    })

    suite.add({
        name: 'redux  call ' + i,
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
