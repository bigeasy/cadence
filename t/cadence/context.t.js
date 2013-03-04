#!/usr/bin/env node

require('proof')(3, function (equal, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence({ context: { number: 1 } })(function (number) {
    equal(number, 1, "enclosed");
  })();

  cadence(function (step) {
    step({ number: 1 });

    step(function (number) {
      equal(number, 1, "set");
    });
  })();

  cadence(function (step) {
    step(function (callback) {
      callback(null, { number: 1 });
    });
  }, function (object, step) {
    if (typeof object == 'object') step(object);
  }, function (number) {
    equal(number, 1, "callback set");
  })();
});
