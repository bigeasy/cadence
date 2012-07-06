#!/usr/bin/env node

require('proof')(2, function (callback, equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence(function (callback) {

    callback(null, 1);

  }, function (number) {

    equal(number, 1, 'callback');

  })(callback());

  cadence(function (_) {

    _(null, 1);

  }, function (number) {

    equal(number, 1, 'streamlined');

  })(callback());
});
