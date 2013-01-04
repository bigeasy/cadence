#!/usr/bin/env node

require('proof')(13, function (async, equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (async) {

    async()(null, "a", 1);
    async()(null, "b", 2);
    async()(null, "c", 3);

  }, function (letters, numbers) {

    equal(letters[0], "a", "letter one");
    equal(letters[1], "b", "letter two");
    equal(letters[2], "c", "letter three");

    equal(numbers[0], 1, "number one");
    equal(numbers[1], 2, "number two");
    equal(numbers[2], 3, "number three");

  }, function (letters, numbers) {

    equal(letters[0], "a", "letter one still");
    equal(letters[1], "b", "letter two still");
    equal(letters[2], "c", "letter three still");

    equal(numbers[0], 1, "number one still");
    equal(numbers[1], 2, "number two still");
    equal(numbers[2], 3, "number three still");

  })(async());

  cadence(function (async) {
    async()(null);
    async()(null);
  }, function () {
    ok(true, 'no arguments');
  })();
});
