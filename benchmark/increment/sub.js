var ok = require('assert').ok
var minimal = require('../../minimal')
var minimal_ = require('../../minimal_')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite

var m = minimal(function (async) {
    async(function () { return 1 })
})

suite.add({
    name: 'minimal call',
    fn: function (deferred) {
        m(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

var m_ = minimal_(function (async) {
    async(function () { return 1 })
})

suite.add({
    name: 'minimal_ call',
    fn: function (deferred) {
        m_(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'minimal call 2',
    fn: function (deferred) {
        m(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'minimal_ call 2',
    fn: function (deferred) {
        m_(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
