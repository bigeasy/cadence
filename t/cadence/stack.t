#!/usr/bin/env node

require('proof')(4, function (async, equal) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , skip = cadence.skip
    ;

  cadence(function (cadence) {

    cadence()(null, 1); 

  }, function (number, cadence) {

    equal(number, 1, "set");
    cadence (function (number) {

      equal(number, 1, "inherited");
      cadence()(null, 2); 
      
    }, function (number) {
    
      equal(number, 2, "overwritten");

    });

  }, function (number) {

    equal(number, 1, "popped");

  })(async());
});
