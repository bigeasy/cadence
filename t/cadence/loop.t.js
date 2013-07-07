#!/usr/bin/env node

require('proof')(3, function (equal) {
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
});
