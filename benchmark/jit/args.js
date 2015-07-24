function baz (a, b, c) {
    console.log(a, b, c)
}

function foo (args) {
    var vargs = []
    for (var i = 0, I = args.length; i < I; i++) {
        vargs[i] = args[i]
    }
    console.log(vargs)
    baz.apply(null, args)
}

function bar () {
    foo(arguments)
}

bar(1, 2, 3)
