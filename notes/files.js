var cadence = require('..')
var fs = require('fs')

function slurp1 (filename, callback) {
    fs.stat(filename, function (error, stat) {
        if (error) callback(error)
        else {
            fs.readFile(filename, 'utf8', function (error, body) {
                if (error) callback(error)
                else callback(null, stat, body)
            })
        }
    })
}

slurp1(__filename, function (error, stat, body) {
    if (error) throw error
    console.log(stat.size, body.substring(0, 12))
})

var slice = [].slice

var slurp2 = cadence(function (async, filename, options) {
    fs.stat(filename, async())
    fs.readFile(filename, 'utf8', async())
})

slurp2(__filename, function (error, stat, body) {
    if (error) throw error
    console.log(stat.size, body.substring(0, 12))
})

function test1 (filename, callback) {
    fs.stat(filename, function (error, stat) {
        if (error) callback(error)
        else {
            fs.readFile(filename, 'utf8', function (error, body) {
                if (error) callback(error)
                else {
                    callback(null, stat.size == body.length)
                }
            })
        }
    })
}

test1(__filename, function (error, result) {
    if (error) throw error
    console.log(result)
})

var test2 = cadence(function (async, filename) {
    async(function () {
        fs.stat(filename, async())
        fs.readFile(filename, 'utf8', async())
    }, function (stat, body) {
        return [ stat.size == body.length, 2 ]
    })
})

test2(__filename, function (error, result, number) {
    if (error) throw error
    console.log(result, number)
})

readConfiguration = cadence(function (async, filename) {
    async(function () {
        var loop = async([function () {
            fs.readFile(filename, 'utf8', async()) // <- try
        }, /^ENOENT$/, function () { // <- catch
            async(function () {
                fs.writeFile(filename, '{}', 'utf8', async())
            }, function () {
                return [ loop() ]
            })
        }], function (body) {
            return [ loop, JSON.parse(body) ]
        })()
    }, function (config) {
        if (config.database) {
            // for older clients
            config.databaseURL = config.database
        }
        return config
    })
})


readConfiguration('config.json', function (error, config) {
    console.log(config)
})
