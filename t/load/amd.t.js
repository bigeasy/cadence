#!/usr/bin/env node

require("proof")(1, function (assert) {
    global.define = function (factory) {
        assert(typeof factory == 'function', 'amd')
    }
    require('../..')
    delete global.define
})
