#!/usr/bin/env node

require('proof')(4, function (async, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    , skip = cadence.skip
    ;

  cadence(function (async) {

    async()(null, 1); 

  }, function (number, async) {

    equal(number, 1, "set");
    async(function (number) {

      equal(number, 1, "inherited");
      async()(null, 2); 
      
    }, function (number) {
    
      equal(number, 2, "overwritten");

    });

  }, function (number) {

    equal(number, 1, "popped");

  })(async());
});
