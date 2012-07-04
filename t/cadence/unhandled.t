#!/usr/bin/env node

require('proof')(2, function (equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , skip = cadence.skip
    ;

  try {
    cadence(function (cadence) {

      throw new Error("thrown");

    })();
  } catch (error) {
    equal(error.message, "thrown", "unhandled throw");
  }

  try {
    cadence(function (cadence) {

      cadence()(new Error("handed"));

    })();
  } catch (error) {
    equal(error.message, "handed", "unhandled error");
  }

});
