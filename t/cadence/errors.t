#!/usr/bin/env node

require('proof')(3, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , errors = []
    ;

  cadence(function (cadence) {
    throw new Error("thrown");
  }, function (error) {
    equal(error.message, "thrown", "intercepted throw");
  })();

  cadence(function (cadence) {
    cadence()(new Error("handed"));
  }, function (error) {
    equal(error.message, "handed", "intercepted passed along");
  })();

  cadence(function (cadence) {
    cadence()();
  }, function (error) {
    throw new Error("should not be called");
  }, function () {
    ok(true, "no error");
  })();
/*
  cadence(function (cadence) {
    cadence()(new Error(1));
    cadence()(new Error(2));
    cadence()();
  }, function (error) {
    errors.push(error);
  }, function () {
    equal(errors.length, 2, "two errors");
  })();*/
});
