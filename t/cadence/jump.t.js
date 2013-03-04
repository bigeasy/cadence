#!/usr/bin/env node

require('proof')(5, function (equal) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {
    var inc;
    step(function () {
      step()(null, 0);
    }, inc = function (count) {
      step()(null, count + 1);
    }, function (count) {
      if (count != 10) step(inc)();
    }, function (count) {
      equal(count, 10, "var");
    });
  })();

  cadence(function (step) {
    step(function () {
      step()(null, 0);
    }, function inc (count) {
      step()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) step(inc)();
    }, function (count) {
      equal(count, 10, "deferred");
    });
  })();

  cadence(function (step) {
    step(function () {
      step()(null, 0);
    }, function inc (count) {
      step()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc();
    }, function (count) {
      equal(count, 10, "invoked");
    });
  })();

  cadence(function (step) {
    step(function () {
      step()(null, 0, "a");
    }, function inc (count, letter) {
      step()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc(count, "b");
    }, function (count, letter) {
      equal(count, 10, "invoked");
      equal(letter, "b", "parameterized");
    });
  })();
});
