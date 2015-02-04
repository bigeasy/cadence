

cadence(function (async, ee) {
    async(function () {
        var ee = async.ee(ee, 'end')
        ee.async('data', function (async, data) {
        })
        ee.sync('data', function () {
        })
        ee.done('end')
        async.error(ee)
    })
})

var ee = new EventEmitter

ee.emit('data', 1)
