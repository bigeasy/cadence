#!/usr/bin/env node

require('proof')(2, function (equal, ok) {
  var fs = require('fs')
    , cadence = require("../../index")()
    ;

  cadence({ number: 1 })(function (number) {
    ok(1, number, "enclosed");
  })();

  cadence(function (cadence) {
    cadence({ number: 1 });

    cadence(function (number) {
      ok(1, number, "set");
    });
  })();
});
