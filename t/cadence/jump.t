#!/usr/bin/env node

require('proof')(5, function (equal) {
  var fs = require('fs'), cadence = require("../../index")();

  cadence(function (async) {
    var inc;
    async(function () {
      async()(null, 0);
    }, inc = function (count) {
      async()(null, count + 1);
    }, function (count) {
      if (count != 10) async(inc)();
    }, function (count) {
      equal(count, 10, "var");
    });
  })();

  cadence(function (async) {
    async(function () {
      async()(null, 0);
    }, function inc (count) {
      async()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) async(inc)();
    }, function (count) {
      equal(count, 10, "deferred");
    });
  })();

  cadence(function (async) {
    async(function () {
      async()(null, 0);
    }, function inc (count) {
      async()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc();
    }, function (count) {
      equal(count, 10, "invoked");
    });
  })();

  cadence(function (async) {
    async(function () {
      async()(null, 0, "a");
    }, function inc (count, letter) {
      async()(null, count + 1);
    }, function (count, inc) {
      if (count != 10) inc(count, "b");
    }, function (count, letter) {
      equal(count, 10, "invoked");
      equal(letter, "b", "parameterized");
    });
  })();
});
