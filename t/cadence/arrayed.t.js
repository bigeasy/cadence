#!/usr/bin/env node

require('proof')(12, function (step, equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (step) {

    var arrays = step([]);
    arrays()(null, "a", 1);
    arrays()(null, "b", 2);
    arrays()(null, "c", 3);

  }, function (letters, numbers) {

    equal(letters[0], "a", "letter one");
    equal(letters[1], "b", "letter two");
    equal(letters[2], "c", "letter three");

    equal(numbers[0], 1, "number one");
    equal(numbers[1], 2, "number two");
    equal(numbers[2], 3, "number three");

  })(step());

  // **TODO**: Undone.
  cadence(function (step) {
    var array = step([]);

    var first = array();

    array()(null);
    array()(null, 'b', 2);

    first(null, 'a');

  }, function (letters, numbers) {

    equal(letters.length, 2, "some undefineds letters count");
    equal(letters.length, 2, "some undefineds numbers count");

    equal(letters[0], "a", "some undefines letter one");
    equal(letters[1], "b", "some undefines letter two");

    ok(numbers[0] === undefined, "some undefines numbers one");
    equal(numbers[1], 2, "some undefines numbers two");

  })();
});
