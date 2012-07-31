#!/usr/bin/env node

require('proof')(1, function (equal, ok, async, deepEqual) {
  var emitter, EventEmitter = require('events').EventEmitter, cadence = require('../..')();

  emitter = new EventEmitter();

  cadence(function (emitter, async) {
    async(emitter).on('data').once('end');
  }, function (data) {
    deepEqual(data, [ 1, 2, 3 ], 'on');
  })(emitter, async());

  emitter.emit('data', 1);
  emitter.emit('data', 2);
  emitter.emit('data', 3);

  emitter.emit('end');
});
