#!/usr/bin/env node

require('proof')(2, function (step, ok, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    fs.readFile(__filename, 'utf8', step());

  }, function (body) {

    ok(/#!/.test(body), "read");

  })(step());


  cadence(function (step) {

    items(step(step, function (items) {
      return items.sort();
    }, function (items) {
      return items.reverse();
    }));

  }, function (items) {

    deepEqual(items, [ 3, 2, 1 ], "inline cadence");

  })(step());
});

function items (callback) {
  callback(null, [ 2, 3, 1 ]);
}
