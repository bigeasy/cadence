#!/usr/bin/env node

require('proof')(5, function (step, deepEqual) {
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

  cadence(function (step) {

    [].forEach(step([], function (number) {
      item(number, step());
    }, function (number) {
      return - number;
    }));

  }, function (items) {

    deepEqual(items, [], 'step arrayed empty');

  })(step());

  cadence(function (step) {

    [ 1, 2, 3 ].forEach(step([], function (number) {
      if (number % 2) step()(null, number);
      else step()(null);
    }));

  }, function (items) {

    deepEqual(items, [ 1, 3 ], 'step arrayed missing');

  })(step());

  cadence(function (step) {

    [ 1 ].forEach(step([], function (number) {
      step(function () {}, function () { return number });
    }));

  }, function (items) {

    deepEqual(items, [ 1 ], 'step arrayed single');

  })(step());

});

function item (value, callback) {
  process.nextTick(function () { callback(null, value) });
}

