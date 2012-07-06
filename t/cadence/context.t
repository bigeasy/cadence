#!/usr/bin/env node

require('proof')(1, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence({ number: 1 })(function (number) {
    ok(1, number, "context");
  })();
});
