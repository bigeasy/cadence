#!/usr/bin/env node

require('proof')(5, function (equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    , errors = []
    ;

  cadence(function () {
    throw new Error("thrown");
  })(function (error) {
    equal(error.message, "thrown", "intercepted throw");
  });

  cadence(function (step) {
    step(Error)(new Error("handed"));
  }, function (error) {
    equal(error.message, "handed", "intercepted passed along");
  })();

  cadence(function (step) {
    step(Error)();
  }, function (error) {
    throw new Error("should not be called");
  }, function () {
    ok(true, "no error");
  })();
/*
    **TODO**: Rethink.
  cadence(function (step) {
    step()(new Error(1));
    step()(new Error(2));
    step()();
  }, function (errors) {
    equal(errors.length, 2, "two errors");
  })();
 */
  cadence(function (step) {
    step(Error)(null, 1);
  }, function (error) {
  }, function (number) {
    equal(number, 1, "no error with value");
  })();

  try {
    cadence(function () {
      throw new Error('exceptional');
    })();
  } catch (e) {
    equal(e.message, 'exceptional', 'default error handler');
  }
});
