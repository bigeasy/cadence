#!/usr/bin/env node

require('proof')(13, function (async, equal) {
  var cadence = require("../../index")()
    ;

  cadence(function (async) {

    async(function () {

      async()(null, 1, 2);

    }, function ($vargs) {

      equal($vargs[0], 1, 'vargs first argument');
      equal($vargs[1], 2, 'vargs second argument');

      async()(null, 1, 2);

    }, function (first, $vargs) {

      equal(first, 1, 'first argument');
      equal($vargs[0], 2, 'vargs rest of arguments');

      async()(null, 1, 2);

    }, function ($vargs, first) {

      equal($vargs[0], 1, 'preserve vargs first argument');
      equal($vargs[1], 2, 'preserve vargs second argument');
      equal(first, 1, 'preserved first context value');

      async()(null, 1, 2, 3);

    }, function ($vargs$1, last, first) {

      equal($vargs$1[0], 1, 'preserve vargs first argument');
      equal($vargs$1[1], 2, 'preserve vargs first argument');
      equal(last, 3, 'preserve vargs second argument');
      equal(first, 1, 'not overwritten first context value');

      async()(null, 3, 2, 1);

    }, function (first, async) {

      equal(first, 3, 'first truncate');
      equal('function', typeof async, 'cadence ends list');

    });

  })(async());
});
