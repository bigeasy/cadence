var cadence = require('../../cadence')
var cadence_ = require('../../_cadence')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('call', { /*minSamples: 100*/ })

function body (1, 2, 3, 4) { return 1 }

var m = cadence(body)

function fn () {
    m(1, 2, 3, 4, 5, 6, 7, function () {})
}

var m_ = cadence_(body)

function fn_ () {
    m_(1, 2, 3, 4, 5, 6, 7, function () {})
}

for (var i = 1; i <= 4; i++)  {
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
