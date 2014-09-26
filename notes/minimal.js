var fs = require('fs')
var domain = require('domain')

fs.readFile(__filename, function (error) {
    if (error) throw error
    var d = domain.create()
    d.on('error', function (error) {
        console.log(error)
    })
    d.run(function () {
        throw Error
    })
})
