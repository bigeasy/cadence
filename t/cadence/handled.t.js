#!/usr/bin/env node

require('proof')(2, function (equal) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function () {

    throw new Error("thrown");

  })(function (error) {
    equal(error.message, "thrown", "handled throw");
  });

  cadence(function (step) {

    step()(new Error("handed"));

  })(function (error) {
    equal(error.message, "handed", "unhandled error");
  });

});
