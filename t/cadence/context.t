#!/usr/bin/env node

require('proof')(3, function (equal, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence({ context: { number: 1 } })(function (number) {
    equal(number, 1, "enclosed");
  })();

  cadence(function (async) {
    async({ number: 1 });

    async(function (number) {
      equal(number, 1, "set");
    });
  })();

  cadence(function (async) {
    async(function (callback) {
      callback(null, { number: 1 });
    });
  }, function (object, async) {
    if (typeof object == 'object') async(object);
  }, function (number) {
    equal(number, 1, "callback set");
  })();
});
