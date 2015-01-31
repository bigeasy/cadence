var ok = require('assert').ok
var cadence = require('..')
var Benchmark = require('benchmark')
var async = require('async')
var streamlined = require('./loop.s._js')

var suite = new Benchmark.Suite

var COUNT = 256

suite.add({
    name: 'async loop',
    fn: function (deferred) {
        var count = 0
        async.whilst(function () {
            return count < COUNT
        }, function (callback) {
            setImmediate(function () {
                count++
                callback()
            })
        }, function (err) {
            deferred.resolve()
            ok(count == COUNT, 'async ok')
        })
    },
    defer: true
})

var loop = cadence(function (async) {
    var count = 0
    async(function () {
        async(function (i) {
            count++
        })(COUNT)
    }, function () {
        return [ count ]
    })
})

suite.add({
    name: 'cadence loop',
    fn: function (deferred) {
        loop(function (error, count) {
            if (error) throw error
            ok(count == COUNT, 'cadence ok')
            deferred.resolve()
        })
    },
    defer: true
})

suite.add({
    name: 'streamline loop',
    fn: function (deferred) {
        streamlined(COUNT, function (error, count) {
            if (error) throw error
            ok(count == COUNT, 'streamline ok')
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
