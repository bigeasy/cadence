var ok = require('assert').ok
var Benchmark = require('benchmark')

// Test whether using a function is a namespace is going to impose a cost on
// performance when looking up an item in the namespace. It appears that all of
// the lookup operations below are relatively similar in performance.
//
// Oddly, at the time of writing, the loaded function is the fastest in the
// benchmarks, but I'm going to treat that as indicating that the difference
// between object and function property lookup is negligible, not that loaded
// functions are what V8 likes best of all.

var suite = new Benchmark.Suite('invoke', { minSamples: 100 })

function a (callback) {
    callback(null, 1)
}

suite.add({
    name: 'callback',
    fn: function () {
        a(function (one) {})
    }
})

function f () { return 1 }

suite.add({
    name: 'function',
    fn: function () {
        var one = f()
    }
})

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
