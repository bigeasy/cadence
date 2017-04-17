require('proof')(1, prove);

function prove (assert, callback) {
    var cadence = require('../..');
    cadence(function (async) {
        async(function () {
          async.hash({
            // Single return value
            single: function() {
              return 1;
            },

            // Multiple return values (all but the first are ignored)
            multiple: function() {
              async()(null, 2);
              async()(null, 3);
            },

            // Return an array to preserve multiple values
            array: function() {
              async(function() {
                async()(null, 4);
                async()(null, 5);
              }, async.splat);
            }
          });
        }, function (result) {
        });
    })(function (error, result) {
        if (error) throw error;
        assert(result, { single: 1, multiple: 2, array: [4, 5] }, 'hash');
        callback();
    });
}
