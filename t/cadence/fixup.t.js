#!/usr/bin/env node

require('proof')(4, function (step, equal, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    echo(1, step(step, function (number) {
      echo(- number, step());
    }));

  }, function (items) {

    deepEqual(items, -1, 'fixup cadence');

  })(step());

  // This triggers a test of error handling when the fixup cadence errors,
  // whether the next object in the sub cadence recieves the error.
  cadence(function (step) {

    step(function () {

      echo(1, step(step, function (number) {
         step(new Error('errored'));
      }));

    }, function () {

      throw new Error('should not be called');

    });

  })(function (error) {

    equal(error.message, 'errored', 'inner error');

  });

  cadence(function (step) {

    echo(1, step(step, function (number) {
      throw new Error('thrown');
      echo(- number, step());
    }));

  })(function (error) {
    equal(error.message, 'thrown', 'errors');
  });

  cadence(function (step) {

    var numbers = step(step, [], function (number) { return - number });
    [ 1, 2, 3 ].forEach(function (number) {
      echo(number, numbers());
    });

  }, function (numbers) {

    deepEqual(numbers, [ -1, -2, -3 ], 'fixup array cadence');

  })(step());
});

function echo (value, callback) { process.nextTick(function () { callback(null, value) }) }
