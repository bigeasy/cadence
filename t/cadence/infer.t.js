#!/usr/bin/env node

require('proof')(4, function (step, equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    , skip = cadence.skip
    ;

  cadence(function (step) {

    fs.readFile(__filename, 'utf8', step());

  }, function (body) {

    ok(body, "exists");
    ok(/candence/.test(body), "read");

  }, function (body) {

    ok(body, "still exists");
    ok(/cadence/.test(body), "still read");

  })(step());
});
