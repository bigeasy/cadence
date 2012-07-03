#!/usr/bin/env node

require('proof')(1, function (callback, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , skip = cadence.skip
    ;

  cadence(function (cadence) {

    fs.readFile(__filename, 'utf8', cadence('body'));

  }, function (body) {

    ok(/#!/.test(body), "read");

  }, callback());
});
