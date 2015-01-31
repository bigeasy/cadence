var ok = require('assert').ok
var cadence = require('..')
var Benchmark = require('benchmark')
var async = require('async')
var streamlined = require('./immediate.s._js')

var suite = new Benchmark.Suite

function callback (callback) {
    setImmediate(function () {
        callback(null, 1)
    })
}

suite.add({
    name: 'streamline loop',
    fn: function (deferred) {
        streamlined(function (error, result) {
            if (error) throw error
            ok(result == 1, 'async ok')
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'callback',
    fn: function (deferred) {
        callback(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

var c = cadence(function (async) {
    async(function () {
        setImmediate(async())
    }, function () {
        return 1
    })
})

suite.add({
    name: 'cadence loop',
    fn: function (deferred) {
        c(function (error, result) {
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
