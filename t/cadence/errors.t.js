#!/usr/bin/env node

require('proof')(13, function (equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    , errors = []
    ;

  cadence(function () {
    throw new Error("thrown");
  })(function (error) {
    equal(error.message, "thrown", "intercepted throw");
  });

  cadence([function (step) {
    step()(new Error("handled"));
  }, function (errors) {
    equal(errors[0].message, "handled", "intercepted passed along");
  }])();

  cadence([function (step) {
    step()();
  }, function (error) {
    throw new Error("should not be called");
  }], function () {
    ok(true, "no error");
  })();

  cadence([function (step) {
    step()(new Error("one"));
    step()(new Error("two"));
    step()();
  }, function (errors, error) {
    equal(errors.length, 2, "got all errors")
    equal(errors[0].message, error.message, "first error is second argument");
  }])();

  cadence([function (step) {
    step()(null, 1);
  }, function (error) {
  }], function (number) {
    equal(number, 1, "no error with value");
  })();

  try {
    cadence(function () {
      throw new Error('exceptional');
    })();
  } catch (e) {
    equal(e.message, 'exceptional', 'default error handler');
  }

  cadence([function (step) {
    step()(new Error("handled"));
  }, "handled", function (errors) {
    equal(errors[0].message, "handled", "condtionally caught equality");
  }])();

  cadence([function (step) {
    step()(new Error("handled"));
  }, /handle/, function (errors) {
    equal(errors[0].message, "handled", "condtionally caught regex");
  }])();

  cadence([function (step) {
    var error = new Error("handled");
    error.code = "ENOENT"
    step()(error);
  }, /ENOENT/, function (errors) {
    equal(errors[0].message, "handled", "condtionally caught code regex");
  }])();

  cadence([function (step) {
    step()(new Error("handled"));
  }, "message", "handled", function (errors) {
    equal(errors[0].message, "handled", "condtionally caught named field equality");
  }])();

  cadence([function (step) {
    step()(new Error("handled"));
  }, "message", /handle/, function (errors) {
    equal(errors[0].message, "handled", "condtionally caught named field regex");
  }])();

  cadence([function (step) {
    step()(new Error("handled"));
  }, "message", "bogus", function (errors) {
    throw new Error("should not get here");
  }])(function (error) {
    equal(error.message, "handled", "condtionally caught failure");
  });
});
