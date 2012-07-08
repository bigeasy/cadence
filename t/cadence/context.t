#!/usr/bin/env node

require('proof')(2, function (equal, ok, equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence({ number: 1 })(function (number) {
    ok(number, 1, "enclosed");
  })();

  cadence(function (cadence) {
    cadence({ number: 1 });

    cadence(function (number) {
      ok(number, 1, "set");
    });
  })();

  cadence(function (cadence) {
    cadence(function (callback) {
      callback(null, { number: 1 });
    });
  }, function (object, cadence) {
    if (typeof object == 'object') cadence(object);
  }, function (number) {
    equal(number, 1, "callback set");
  })();
});
