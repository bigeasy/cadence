#!/usr/bin/env node

require('proof')(5, function (equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    , errors = []
    ;

  cadence(function () {
    throw new Error("thrown");
  }, function (error) {
    equal(error.message, "thrown", "intercepted throw");
  })();

  cadence(function (async) {
    async()(new Error("handed"));
  }, function (error) {
    equal(error.message, "handed", "intercepted passed along");
  })();

  cadence(function (async) {
    async()();
  }, function (error) {
    throw new Error("should not be called");
  }, function () {
    ok(true, "no error");
  })();

  cadence(function (async) {
    async()(new Error(1));
    async()(new Error(2));
    async()();
  }, function (errors) {
    equal(errors.length, 2, "two errors");
  })();
  
  cadence(function (async) {
    async()(null, 1);
  }, function (error) {
  }, function (number) {
    equal(number, 1, "no error");
  })();
});
