var cadence = require('../..')

function Program () {}

function program () { // (one, two, three) {
    return 1
}
Program.prototype.varadic = cadence(program)

var program = new Program

function invoke () {
    program.varadic(1, 2, 3, 4, 5, 6, 7, noop)
}

for (var i = 0; i < 1000000; i++) {
    invoke()
}

function noop () {}
