#!/usr/bin/env node

require('proof')(1, function (step, equal) {
  var cadence = require('../..');

  cadence(function (step) {

    step(function () {
      step()(null);
      step()(null, 1);
    }, function (x) {
      equal(x, 1, 'default is zero');
    });

  })(step());
});
