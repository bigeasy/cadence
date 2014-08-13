#!/usr/bin/env node

require("proof")(1, function (ok) {
  global.define = function (factory) {
    ok(typeof factory == 'function', 'amd');
  }
  require('../..');
  delete global.define;
});
