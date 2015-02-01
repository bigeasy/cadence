function inc (count, _) {
    return count + 1
}

module.exports = function (COUNT, inc, _) {
    var count = 0
    while (count != 256) {
        count = inc(count, _)
    }
    return count
}
