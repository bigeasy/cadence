require("proof")(1, prove)

function prove (assert) {
    global.window = {}
    require('../../minimal')
    assert(typeof window.cadence == 'function', 'window')
    delete global.window
}
