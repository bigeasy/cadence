#!/usr/bin/env node

require('proof')(1, function (equal, ok, step, deepEqual) {
  return ok(1);

  var emitter, EventEmitter = require('events').EventEmitter, cadence = require('../..');

  emitter = new EventEmitter();

  cadence(function (emitter, step) {
    step(emitter).on('data').once('end');
  }, function (data) {
    deepEqual(data, [ 1, 2, 3 ], 'on');
  })(emitter, step());

  emitter.emit('data', 1);
  emitter.emit('data', 2);
  emitter.emit('data', 3);

  emitter.emit('end');
});
