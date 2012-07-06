#!/usr/bin/env node

require('proof')(1, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")({ alias: 'async' })
    ;

  cadence(function (async) {
    async()(null, 1);
  }, function (number) {
    ok(1, number, "aliased");
  })();
});
