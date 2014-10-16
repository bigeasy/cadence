#!/usr/bin/env node

require('proof')(4, function (assert) {
    var cadence = require('../..')
    var f = cadence(function (one, two, three, four, five) { Snuffleupagus })
    assert(f.isCadence, 'flagged')
    assert(f.name, '', 'anonymous')
    assert(f.length, 5, 'dynamic arity')
    assert(/Snuffleupagus/.test(f.toString()), 'to string')
})
