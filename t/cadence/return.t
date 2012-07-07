#!/usr/bin/env node

require('proof')(3, function (callback, equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , one = callback(), two = callback()
    ;

  cadence(function () {
    return 1;
  }, function (number) {
    equal(number, 1, "return step");
  })();

  cadence(function (cadence) {
    return 1;
  })(function (error, number) {
    equal(number, 1, "return cadence");
    one();
  });

  cadence(function (cadence) {
    cadence()(null, 1);
  })(function (error, number) {
    equal(number, 1, "callback cadence");
    two();
  });
});
