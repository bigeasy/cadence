#!/usr/bin/env node

require('proof')(2, function (assert) {
    var cadence = require('../..')
    var f = cadence(function (one, two, three, four, five) {})
    assert(f.name, '', 'anonymous')
    assert(f.length, 5, 'dynamic arity')
})
