#!/usr/bin/env node

require('proof')(3, function (step, ok, equal) {
  var cadence = require('../..');
  var object = {};
  object.method = cadence(function (step) {
    step(function () {
      step(step, function () {
        ok(this === object, 'inside');
        this.value = 1;
        return this;
      })(null);
    });
  });

  object.method(function (error, result)  {
    ok(result === object, 'this');
    equal(object.value, 1, 'value');
  });
});
