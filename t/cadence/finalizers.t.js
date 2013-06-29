#!/usr/bin/env node

require('proof')(4, function (equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  var object = {};

  // Simple example of a finalizer.
  cadence(function (step, object) {

    step([function () {
      ok(object.used, 'leading finalizer closed');
      object.closed = true;
    }], function () {
      ok(!object.closed, 'leading finalizer open');
      object.used = true;
      return object;
    });

  })({}, function (error, object) {
    if (error) throw error;
    ok(object.used, 'leading finalizer was used'); 
    ok(object.closed, 'leading finalizer was closed'); 
  });

});
