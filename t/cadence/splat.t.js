require('proof')(2, prove)

function prove (assert, callback) {
    var cadence = require('../..')
    cadence(function (async) {
        async(function () {
          async()(null, 1);
          async()(null, 2);
          async()(null, 3);
        }, async.splat, function (result) {
            assert(result, [1, 2, 3], 'splat step')

            async.splat(function() {
              return [4, 5, 6];
            });
        });
    })(function (error, result) {
        if (error) throw error
            assert(result, [4, 5, 6], 'splat function')
        callback()
    })
}
