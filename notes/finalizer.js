var f = cadence(function (async) {
    async(function () {
        fs.open(__filename, async())
    }, [function (fd) {
        fs.close(fd, async())
    }], function (fd) {
        fs.write(fd, new Buffer(10))
    })
})
