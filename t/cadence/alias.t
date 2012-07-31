#!/usr/bin/env node

require('proof')(1, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")({ alias: 'aliased' })
    ;

  cadence(function (aliased) {
    aliased()(null, 1);
  }, function (number) {
    ok(number, 1, "aliased");
  })();
});
