#!/usr/bin/env node

require('proof')(5, function (equal) {
  var fs = require('fs'), cadence = require("../../index")();

  cadence(function (cadence) {
    var inc;
    cadence(function () {
      cadence()(null, 0);
    }, inc = function (count) {
      cadence()(null, count + 1);
    }, function (count) {
      if (count != 10) cadence(inc)();
    }, function (count) {
      equal(count, 10, "var");
    });
  })();

  cadence(function (cadence) {
    cadence(function () {
      cadence()(null, 0);
    }, function inc (count) {
      cadence()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) cadence(inc)();
    }, function (count) {
      equal(count, 10, "deferred");
    });
  })();

  cadence(function (cadence) {
    cadence(function () {
      cadence()(null, 0);
    }, function inc (count) {
      cadence()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc();
    }, function (count) {
      equal(count, 10, "invoked");
    });
  })();

  cadence(function (cadence) {
    cadence(function () {
      cadence()(null, 0, "a");
    }, function inc (count, letter) {
      cadence()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc(count, "b");
    }, function (count, letter) {
      equal(count, 10, "invoked");
      equal(letter, "b", "parameterized");
    });
  })();
});
