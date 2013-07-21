var cadence = require('cadence')
var edify = require('edify')

module.exports = cadence(function (step, $, cache) {
    step(function () {
        edify.marked($, '.markdown', step())
    }, function () {
        // todo: some way to say replace
        //
        // todo: fixup shebang lines.
        //
        // maybe pass in the selection, plus the name of the method to use to
        // insert the html?
        //
        // Maybe accept a method that passes back the element and the
        // transformed text and you insert it?
        //
        // Until then, ugly markup. :(
        edify.pygments($, '.lang-javascript', 'javascript', cache, step())
    })
})
