#!/usr/bin/env node

require('proof')(2, function (equal, ok, step, deepEqual) {
  var  EventEmitter = require('events').EventEmitter,
       ee = new EventEmitter();
       cadence = require('../..');


  cadence(function (step, ee) {
    step(function () {
      var on = step('on');
      on(ee, 'data', []);
      on(ee, 'end');
    }, function (data) {
      deepEqual(data, [ 1, 2, 3 ], 'events');
    });
  })(ee, step());

  ee.emit('data', 1);
  ee.emit('data', 2);
  ee.emit('data', 3);

  ee.emit('end');

  cadence(function (step, ee) {
    step(function () {
      var on = step('on', ee);
      on('data', []);
      on('end');
    }, function (data) {
      deepEqual(data, [ 1, 2, 3 ], 'events bound to specific object');
    });
  })(ee, step());

  ee.emit('data', 1);
  ee.emit('data', 2);
  ee.emit('data', 3);

  ee.emit('end');
});
