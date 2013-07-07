#!/usr/bin/env node

require('proof')(6, function (equal, deepEqual) {
  var fs = require('fs'), cadence = require('../..');

  cadence(function (step) {
    var count = 0;
    step(function () {
      count++;
    }, function () {
      if (count == 10) step(null, count);
    })();
  })(function (error, result) {
    if (error) throw error;
    equal(result, 10, "loop");
  });

  cadence(function (step) {
    var count = 0;
    var starter = step(function () {
      count++;
    }, function () {
      if (count == 10) step(null, count);
    });
    starter();
    starter();
  })(function (error, result) {
    if (error) throw error;
    equal(result, 10, "double start loop");
  });

  cadence(function (step) {
    var count = 0;
    step(function () {
      return ++count;
    })(10);
  })(function (error, result) {
    if (error) throw error;
    equal(result, 10, "counted loop");
  });

  cadence(function (step) {
    var sum = 0
    step(function (number) {
      step()(null, sum = sum + number)
    })([ 1, 2, 3, 4 ])
  })(function (error, result) {
    if (error) throw error
    equal(result, 10, "reduced each loop")
  });

  cadence(function (step) {
    var count = 0
    step(function (number) {
      step()(null, ++count);
    })([], 4)
  })(function (error, result) {
    if (error) throw error
    deepEqual(result, [ 1, 2, 3, 4 ], "gathered counted loop")
  });

  cadence(function (step) {
    var sum = 0
    step(function (number) {
      step()(null, sum = sum + number)
    })([], [ 1, 2, 3, 4 ])
  })(function (error, result) {
    if (error) throw error
    deepEqual(result, [ 1, 3, 6, 10 ], "gathered each loop")
  });
});
