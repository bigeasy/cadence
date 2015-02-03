require('proof')(1, prove)

function prove (assert) {
    global.define = function (factory) {
        assert(typeof factory == 'function', 'amd')
    }
    require('../../redux')
    delete global.define
}
