var fs = require('fs')

var got

var start = process.hrtime()

function get (callback) {
    if (got) {
        // callback(null, got)
        setImmediate(callback, null, got) // <- has lots of overhead, not as
                                          // much as timeout, but more than nothing
    } else {
        // save a read vvv
        fs.readFile(__filename, 'utf8', function (error, result) {
            if (error) throw error
            got = result
            callback(null, result)
        })
    }
}


function redo (count) {
    get(function (error, result) {
        if (error) throw error
        if (count > 0) redo(count - 1)
        else console.log(process.hrtime(start))
    })
}

redo(1000000)
