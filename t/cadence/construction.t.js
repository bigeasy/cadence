#!/usr/bin/env node

require('proof')(1, function (assert) {
    var cadence = require('../..')
    var f = cadence(function () {})
    assert(f.name, '', 'anonymous')
})
