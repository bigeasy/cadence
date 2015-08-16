var cadence = require('../cadence')

function echo (value, callback) {
//    setImmediate(callback, null, value)
    callback(null, value)
}

var f = cadence(function (async) {
    async(function () {
        echo(1, async())
    }, function (value) {
        console.log(value)
    })
})

f(function (error) { if (error) throw error })
