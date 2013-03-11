#!/usr/bin/env node

require('proof')(3, function (step, deepEqual, say) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    var done = step(2);
    var items = step([])([]);
    generate([ 1, 2, 3 ], items, done);

  }, function (one, two, items) {

    deepEqual(one, 1, 'first');
    deepEqual(two, 2, 'second');
    deepEqual(items, [ 1, 2, 3 ], 'gathered');

  })(step());

});

function generate (values, array, done) {
  values.forEach(function (value) { array(null, value) });
  done(null, 1, 2);
}
