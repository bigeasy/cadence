var cadence = require('..')

var loop = cadence(function (async) {
    var count = 0
    async(function () {
        async(function (i) {
            return count++
        })(256 * 10)
    }, function () {
        return [ count ]
    })
})

loop(function (error, count) {
    if (error) throw error
    console.log(count)
})
