#!/usr/bin/env node

require('proof')(6, function (step, ok, equal) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {

    step()(null, 1);
    step()(null, 2);

  }, function (first, second) {

    equal(first, 1, 'first');
    equal(second, 2, 'second');

  })(step());

  cadence(function (step) {

    step(2)(null);
    step()(null, 3);
    step()(null, null);

  }, function (first, second, third, fourth) {

    ok(first === (void 0), 'first undefined');
    ok(second === (void 0), 'second undefined');
    equal(third, 3, 'third not undefined');
    ok(fourth === null, 'fourth null');

  })(step());
});
