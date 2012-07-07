#!/usr/bin/env node

require('proof')(13, function (callback, equal) {
  var cadence = require("../../index")()
    ;

  cadence(function (cadence) {

    cadence(function () {

      cadence()(null, 1, 2);

    }, function ($vargs) {

      equal(1, $vargs[0], 'vargs first argument');
      equal(2, $vargs[1], 'vargs second argument');

      cadence()(null, 1, 2);

    }, function (first, $vargs) {

      equal(1, first, 'first argument');
      equal(2, $vargs[0], 'vargs rest of arguments');

      cadence()(null, 1, 2);

    }, function ($vargs, first) {

      equal(1, $vargs[0], 'preserve vargs first argument');
      equal(2, $vargs[1], 'preserve vargs second argument');
      equal(1, first, 'preserved first context value');

      cadence()(null, 1, 2, 3);

    }, function ($vargs$1, last, first) {

      equal(1, $vargs$1[0], 'preserve vargs first argument');
      equal(2, $vargs$1[1], 'preserve vargs first argument');
      equal(3, last, 'preserve vargs second argument');
      equal(1, first, 'not overwritten first context value');

      cadence()(null, 3, 2, 1);

    }, function (first, cadence) {

      equal(3, first, 'first truncate');
      equal(typeof cadence, 'function', 'cadence ends list');

    });

  })(callback());
});
