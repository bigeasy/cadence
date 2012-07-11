#!/usr/bin/env node

require('proof')(2, function (async, equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence(function (callback) {

    callback(null, 1);

  }, function (number) {

    equal(number, 1, 'callback');

  })(async());

  cadence(function (_) {

    _(null, 1);

  }, function (number) {

    equal(number, 1, 'streamlined');

  })(async());
});
