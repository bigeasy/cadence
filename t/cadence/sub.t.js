#!/usr/bin/env node

require('proof')(2, function (step, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    step(function () {
      return 1;
    });

  })(function (error, result) {

    deepEqual(result, 1, "step");

  });

  cadence(function (step) {

    [ 1, 2, 3 ].forEach(step([], function (number) {
      item(number, step());
    }, function (number) {
      return - number;
    }));

  }, function (items) {

    deepEqual(items, [ -1, -2, -3 ], 'step arrayed');

  })(step());

});
function item (number, callback) { callback(null, number) };
