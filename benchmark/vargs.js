var Benchmark = require('benchmark')
var slice = [].slice

var suite = new Benchmark.Suite

function foo () {
}

function varged (vargs) {
    foo.apply(null, vargs)
}

function inlineable () {
    var vargs = new Array
    for (var i = 0, I = arguments.length; i < I; i++) {
        vargs.push(arguments[i])
    }
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

suite.add({ name: 'slice', fn: function () { sliced(1, 2, 3, 4, 5, 6, 7) } })
suite.add({ name: 'arrayed', fn: function () { arrayed(1, 2, 3, 4, 5, 6, 7) } })
suite.add({ name: 'pushed', fn: function () { pushed(1, 2, 3, 4, 5, 6, 7) } })
suite.add({ name: 'inlineable', fn: function () { inlineable(1, 2, 3, 4, 5, 6, 7) } })
suite.add({ name: 'proxied', fn: function () { proxied(1, 2, 3, 4, 5, 6, 7) } })

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

suite.run()

// Node.js 0.10.36
// slice x 5,755,248 ops/sec ±1.25% (95 runs sampled)
// arrayed x 4,465,174 ops/sec ±1.16% (97 runs sampled)
// proxied x 3,810,585 ops/sec ±1.12% (98 runs sampled)
// Fastest is slice

// Node.js 0.12.4
// slice x 4,463,986 ops/sec ±0.90% (98 runs sampled)
// arrayed x 10,273,785 ops/sec ±1.18% (94 runs sampled)
// proxied x 8,058,767 ops/sec ±1.09% (100 runs sampled)
// Fastest is arrayed
