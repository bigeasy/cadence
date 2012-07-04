#!/usr/bin/env node

require('proof')(3, function (ok, equal) {
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

  try {
    cadence(function () {})();
    ok(1, "no exception");
  } catch (e) {
    ok(0, "no exception");
  }
});
