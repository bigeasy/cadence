#!/usr/bin/env node

require('proof')(2, function (callback, equal) {
  var cadence = require("../../index")();
  cadence(function (number, letter, cadence) {
    equal(1, number, 'first argument');
    equal('a', letter, 'second argument');
  })(1, 'a', callback());
});
