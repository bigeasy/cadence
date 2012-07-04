#!/usr/bin/env node

require('proof')(3, function (callback, equal, equal) {
  var fs = require('fs')
    , cadence = require("../../index")({ wrap: { cleanup: wrap } })
    , skip = cadence.skip
    , wrapped = 0
    , invoked = 0
    ;

  cadence(function (cadence) {

    cadence()(null, 1);

  }, function cleanup (one) {

    equal(one, 1, "invoked");
    cadence()(null, 2);

  }, function (two) {

    equal(1, wrapped, "function wrapped");
    equal(1, invoked, "wrapper called");

  })(callback());

  function wrap (proc) {
    wrapped++;
    return function () {
      invoked++;
      proc.apply(null, arguments);
    }
  }
});
