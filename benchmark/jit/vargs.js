var Benchmark = require('benchmark')
var slice = [].slice

var suite = new Benchmark.Suite

function foo () {
}

function varged (vargs) {
    foo.apply(null, vargs)
}

function arged (args) {
    var vargs = []
    for (var i = 0, I = args.length; i < I; i++) {
        vargs[i] = args[i]
    }
    foo.apply(null, vargs)
}

function sliced () {
    varged(slice.call(arguments))
}

function concated () {
}

function inlinable () {
    var vargs = new Array
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs.push(arguments[i])
    }
    varged(vargs)
}

function pushed () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs.push(arguments[i])
    }
    varged(vargs)
}

function arrayed () {
    var vargs = []
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs[i] = arguments[i]
    }
    varged(vargs)
}

function proxied () {
    arged(arguments)
}

function callSliced () {
    sliced(1, 2, 3, 4, 5, 6, 7)
}

for (var i = 0; i < 10000; i++) {
    callSliced()
}

function callArrayed () {
    arrayed(1, 2, 3, 4, 5, 6, 7)
}

for (var i = 0; i < 10000; i++) {
    callArrayed()
}

function callProxied () {
    proxied(1, 2, 3, 4, 5, 6, 7)
}

for (var i = 0; i < 10000; i++) {
    callProxied()
}

function callPushed () {
    pushed(1, 2, 3, 4, 5, 6, 7)
}

for (var i = 0; i < 10000; i++) {
    callPushed()
}

function callInlinble () {
    inlinable(1, 2, 3, 4, 5, 6, 7)
}

for (var i = 0; i < 10000; i++) {
    callInlinble()
}
