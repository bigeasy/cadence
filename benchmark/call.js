var ok = require('assert').ok
var cadence = require('..')
var minimal = require('../minimal')
var Benchmark = require('benchmark')
var async = require('async')
var streamlined = require('./scall._js')

var suite = new Benchmark.Suite

function callback (callback) {
    callback(null, 1)
}

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
    return 1
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

var m = minimal(function (aysnc) {
    return 1
})

var ms = minimal(function (async) {
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

suite.add({
    name: 'minimal call with sub cadence',
    fn: function (deferred) {
        ms(function (error, result) {
            ok(result == 1, 'callback')
            deferred.resolve()
        })
    },
    defer: true
})

/*
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
*/

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
