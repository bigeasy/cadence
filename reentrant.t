#!/usr/bin/env node

require('proof')(1, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    , tree = [ branch: { branch: [ 1, 2 ], branch: { branch: [ 3, 4 ] } } }
    ;

  cadence(function (cadence) {
    return tree;
  }, function nextBranch (branch) {
    if (!array.length || !Array.isArray(branch[0])) {

    } else {
    }
  }, function (number, cadence) {
  })();

});
