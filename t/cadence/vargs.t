#!/usr/bin/env node

require('proof')(13, function (async, equal) {
  var cadence = require("../../index")()
    ;

  cadence(function (cadence) {

    cadence(function () {

      cadence()(null, 1, 2);

    }, function ($vargs) {

      equal($vargs[0], 1, 'vargs first argument');
      equal($vargs[1], 2, 'vargs second argument');

      cadence()(null, 1, 2);

    }, function (first, $vargs) {

      equal(first, 1, 'first argument');
      equal($vargs[0], 2, 'vargs rest of arguments');

      cadence()(null, 1, 2);

    }, function ($vargs, first) {

      equal($vargs[0], 1, 'preserve vargs first argument');
      equal($vargs[1], 2, 'preserve vargs second argument');
      equal(first, 1, 'preserved first context value');

      cadence()(null, 1, 2, 3);

    }, function ($vargs$1, last, first) {

      equal($vargs$1[0], 1, 'preserve vargs first argument');
      equal($vargs$1[1], 2, 'preserve vargs first argument');
      equal(last, 3, 'preserve vargs second argument');
      equal(first, 1, 'not overwritten first context value');

      cadence()(null, 3, 2, 1);

    }, function (first, cadence) {

      equal(first, 3, 'first truncate');
      equal('function', typeof cadence, 'cadence ends list');

    });

  })(async());
});
