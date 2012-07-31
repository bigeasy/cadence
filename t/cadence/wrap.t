#!/usr/bin/env node

require('proof')(3, function (async, equal) {
  var fs = require('fs')
    , cadence = require('../..')({ wrap: { cleanup: wrap } })
    , wrapped = 0
    , invoked = 0
    ;

  cadence(function (async) {

    async()(null, 1);

  }, function cleanup (one, async) {

    equal(one, 1, "invoked");
    async()(null, 2);

  }, function (two) {

    equal(wrapped, 1, "function wrapped");
    equal(invoked, 1, "wrapper called");

  })(async());

  function wrap (proc) {
    wrapped++;
    return function () {
      invoked++;
      proc.apply(null, arguments);
    }
  }
});
