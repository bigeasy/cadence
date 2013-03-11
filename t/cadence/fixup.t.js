#!/usr/bin/env node

require('proof')(2, function (step, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    echo(1, step(step, function (number) {
      return - number;
    }));

  }, function (items) {

    deepEqual(items, -1, 'fixup cadence');

  })(step());

  cadence(function (step) {

    var numbers = step(step, [], function (number) { return - number });
    [ 1, 2, 3 ].forEach(function (number) {
      echo(number, numbers());
    });

  }, function (numbers) {

    deepEqual(numbers, [ -1, -2, -3 ], 'fixup array cadence');

  })(step());
});

function echo (value, callback) { callback(null, value); }
