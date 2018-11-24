var cadence = require('../..')

var f = cadence(function () { return 0 })

for (var i = 0; i < 1000000; i++) {
    f(function () {})
}
