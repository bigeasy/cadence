#!/usr/bin/env node

require('proof')(1, function (equal) {
  var fs = require('fs'), cadence = require("../../index")();

  cadence(function (cadence) {
    var inc;
    cadence(function () {
      cadence()(null, 0);
    }, inc = function (count) {
      cadence()(null, count + 1);
    }, function (count) {
      if (count != 10) cadence(inc);
    }, function (count) {
      equal(10, count, "jump");
    });
  })();
});
