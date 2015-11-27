var cadence = require('..')

var loop = cadence(function (async) {
    var count = 0
    async(function () {
        var loop = async(function (i) {
            if (i == (256 * 10)) return [ loop.break, i ]
            return count++
        })()
    }, function () {
        return [ count ]
    })
})

loop(function (error, count) {
    if (error) throw error
    console.log(count)
})
