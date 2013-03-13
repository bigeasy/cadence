#!/usr/bin/env node

require('proof')(10, function (step, equal, deepEqual) {
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

  cadence(function (step) {

    var done = step(2);
    var items = step([])([]);
    generateIf([ 1, 2, 3 ], items, done);

  }, function (one, two, items) {

    deepEqual(one, 1, 'prune first');
    deepEqual(two, 2, 'prune second');
    deepEqual(items, [ 1, 3 ], 'prune gathered');

  })(step());

  cadence(function (step) {

    var done = step(2);
    var items = step([])([]);
    generate([], items, done);

  }, function (one, two, items) {

    deepEqual(one, 1, 'empty first');
    deepEqual(two, 2, 'empty second');
    deepEqual(items, [], 'empty gathered');

  })(step());

  cadence(function (step) {
    try {
      var many = step([]);
      many([]);
      many([]);
    } catch (e) {
      equal(e.message, 'zero-to-many already determined');
    }
  })();
});

function generate (values, array, done) {
  values.forEach(function (value) { array(null, value) });
  done(null, 1, 2);
}

function generateIf (values, array, done) {
  values.forEach(function (value) {
    if (value % 2) array(null, value)
    else array(null);
  });
  done(null, 1, 2);
}
