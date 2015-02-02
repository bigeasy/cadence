var ok = require('assert').ok
var minimal = require('../../minimal')
var minimal_ = require('../../minimal_')
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('sub', { minSamples: 100 })

var m = minimal(function (async) {
    async(function () { return 1 })
})

function fnm (deferred) {
    m(function (error, result) {
        deferred.resolve()
        ok(result == 1, 'callback')
    })
}

var m_ = minimal_(function (async) {
    async(function () { return 1 })
})

function fnm_ (deferred) {
    m_(function (error, result) {
        deferred.resolve()
        ok(result == 1, 'callback')
    })
}

suite.add({
    name: 'minimal  call 1',
    fn: fnm,
    defer: true
})

suite.add({
    name: 'minimal_ call 1',
    fn: fnm_,
    defer: true
})

suite.add({
    name: 'minimal  call 2',
    fn: fnm,
    defer: true
})

suite.add({
    name: 'minimal_ call 2',
    fn: fnm_,
    defer: true
})

suite.add({
    name: 'minimal  call 3',
    fn: fnm,
    defer: true
})

suite.add({
    name: 'minimal_ call 3',
    fn: fnm_,
    defer: true
})

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()
