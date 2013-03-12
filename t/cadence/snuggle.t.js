#!/usr/bin/env node

require('proof')(1, function (step, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (step) {

    fs.readFile(__filename, 'utf8', step());

  }, function (body) {

    // Get body loaded into the conext.

  }, function (step,body) { // Was broken, unable to separate parameters.

    ok(body, "read");

  })(step());
});
