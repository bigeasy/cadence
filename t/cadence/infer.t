#!/usr/bin/env node

require('proof')(4, function (callback, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , skip = cadence.skip
    ;

  cadence(function (cadence) {

    fs.readFile(__filename, 'utf8', cadence());

  }, function (body) {

    ok(body, "exists");
    ok(/candence/.test(body), "read");

  }, function (body) {

    ok(body, "still exists");
    ok(/cadence/.test(body), "still read");

  })(callback());
});
