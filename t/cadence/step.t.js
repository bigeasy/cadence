#!/usr/bin/env node

require('proof')(1, function (async, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (step) {

    fs.readFile(__filename, 'utf8', step('body'));

  }, function (body) {

    ok(/#!/.test(body), "read");

  })(async());
});
