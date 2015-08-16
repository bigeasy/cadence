var cadence = require('../cadence')

function echo (value, callback) {
    callback(null, value)
}

var f = cadence(function (async) {
    async(function () { // <- is a step
        setTimeout(async(), 1000)
    }, function () {
        async(function () {
            echo(1, async())
        }, function (value) {
            console.log(value)
        })
    })
})

f(function (error) { if (error) throw error })
