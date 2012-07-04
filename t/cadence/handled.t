#!/usr/bin/env node

require('proof')(2, function (equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , skip = cadence.skip
    ;

  cadence(function (cadence) {

    throw new Error("thrown");

  })(function (error) {
    equal(error.message, "thrown", "handled throw");
  });

  cadence(function (cadence) {

    cadence()(new Error("handed"));

  })(function (error) {
    equal(error.message, "handed", "unhandled error");
  });

});
