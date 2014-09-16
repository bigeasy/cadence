#!/usr/bin/env node

require("proof")(1, function (assert) {
    global.window = {}
    require('../..')
    assert(typeof window.cadence == 'function', 'window')
    delete global.window
})
