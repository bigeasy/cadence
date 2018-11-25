var cadence = require('../../cadence')
var cadence_ = require('../../_cadence')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('async')

function body () { return 0 }

function fn () {
    cadence(body)(function () {})
}

function fn_ () {
    cadence_(body)(function () {})
}

for (var i = 1; i <= 4; i++)  {
    suite.add({
        name: ' cadence create ' + i,
        fn: fn
    })

    suite.add({
        name: '_cadence create ' + i,
        fn: fn_
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
