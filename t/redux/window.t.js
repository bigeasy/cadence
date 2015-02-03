require('proof')(1, prove)

function prove (assert) {
    global.window = {}
    require('../../redux')
    assert(typeof window.cadence == 'function', 'window')
    delete global.window
}
