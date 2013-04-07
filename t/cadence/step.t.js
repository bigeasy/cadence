#!/usr/bin/env node

require('proof')(1, function (step, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    item(1, step());

  }, function (number) {

    deepEqual(number, 1, 'step');

  })(step());
});

function item (number, callback) { callback(null, number) };
