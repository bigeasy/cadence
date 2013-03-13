#!/usr/bin/env node

require('proof')(2, function (step, equal) {
  var cadence = require('../..');
  cadence(function (step, number, letter) {
    equal(number, 1, 'first argument');
    equal('a', letter, 'second argument');
  })(1, 'a', step());
});
