#!/usr/bin/env node

require('proof')(1, function (async, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence(function (async) {

    fs.readFile(__filename, 'utf8', async('body'));

  }, function (body) {

    ok(/#!/.test(body), "read");

  })(async());
});
