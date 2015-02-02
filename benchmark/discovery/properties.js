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

var suite = new Benchmark.Suite('properties', { minSamples: 100 })

function f () {
}

f.a = 1

function lf () {
}

for (var i = 0; i < 1024 * 16; i++) {
    lf[i] = i
}

lf.a = 1

var hash = { "\0": 1 }

var loaded = {}

for (var i = 0; i < 1024 * 16; i++) {
    loaded[i] = i
}

loaded.a = 1

var object = { a: 1 }

suite.add({
    name: 'hashed weird key property',
    fn: function () {
        if (hash['\0'] != 1) {
            throw new Error
        }
    }
})

suite.add({
    name: 'hash with many properties',
    fn: function () {
        if (loaded.a != 1) {
            throw new Error
        }
    }
})

suite.add({
    name: 'object property subscript',
    fn: function () {
        if (object['a'] != 1) {
            throw new Error
        }
    }
})

suite.add({
    name: 'object property',
    fn: function () {
        if (object.a != 1) {
            throw new Error
        }
    }
})

suite.add({
    name: 'function property',
    fn: function () {
        if (f.a != 1) {
            throw new Error
        }
    }
})

suite.add({
    name: 'loaded function property',
    fn: function () {
        if (lf.a != 1) {
            throw new Error
        }
    }
})

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
