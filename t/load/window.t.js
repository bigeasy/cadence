#!/usr/bin/env node

require("proof")(1, function (ok) {
  global.window = {};
  require('../..');
  ok(typeof window.cadence == 'function', 'window');
  delete global.window;
});
