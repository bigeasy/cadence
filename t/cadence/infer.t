#!/usr/bin/env node

require('proof')(6, function (callback, equal, ok) {
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

  cadence(function (cadence) {
    cadence()(null, 1, 'a');
  }, function (cadence, number, letter) {
    equal(1, number, 'skip cadence first argument');
    equal('a', letter, 'skip cadence second argument');
  })();
});
