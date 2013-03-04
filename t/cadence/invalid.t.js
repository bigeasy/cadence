#!/usr/bin/env node

require('proof')(1, function (async, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  cadence(function (async) {

    async('a', 1);

  })(function (error) {
    equal(error.message, 'invalid arguments');
  });
});
