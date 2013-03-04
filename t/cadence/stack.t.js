#!/usr/bin/env node

require('proof')(4, function (async, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    , skip = cadence.skip
    ;

  cadence(function (step) {

    step()(null, 1); 

  }, function (number, step) {

    equal(number, 1, "set");
    step(function (number) {

      equal(number, 1, "inherited");
      step()(null, 2); 
      
    }, function (number) {
    
      equal(number, 2, "overwritten");

    });

  }, function (number) {

    equal(number, 1, "popped");

  })(async());
});
