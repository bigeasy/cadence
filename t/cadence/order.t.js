#!/usr/bin/env node

require('proof')(2, function (step, equal) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    step()(null, 1);
    step()(null, 2);

  }, function (first, second) {

    equal(first, 1, 'first');
    equal(second, 2, 'first');

  })(step());
});
