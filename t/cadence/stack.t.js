#!/usr/bin/env node

require('proof')(4, function (step, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    , skip = cadence.skip
    ;

  cadence(function (step) {

    step()(null, 1);

  }, function (number, step) {

    equal(number, 1, "set");
    // **TODO**: Expecting `step(0, function (number) {` to mean no response.
    step(function (number) {

      equal(number, 1, "inherited");
      step()(null, 2);

    }, function (number) {

      equal(number, 2, "overwritten");

    });

  }, function (x, number) {

    console.log(x);
    equal(number, 1, "popped");

  })(step());
});
