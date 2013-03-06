#!/usr/bin/env node

require('proof')(2, function (step, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (callback) {

    callback(null, 1);

  }, function (number) {

    equal(number, 1, 'callback');

  })(step());

  cadence(function (_) {

    _(null, 1);

  }, function (number) {

    equal(number, 1, 'streamlined');

  })(step());
});
