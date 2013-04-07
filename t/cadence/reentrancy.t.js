#!/usr/bin/env node

require('proof')(1, function (equal, ok) {
  var cadence = require('../..');

  cadence(function (step) {
    step(function () {
      cadence(function (step) {
        step(function () {
          throw new Error('errored');
        });
      })(step());
    });
  })(function (error) {
    equal(error.message, 'errored', 'reentrant');
  });
});
