#!/usr/bin/env node

require('proof')(9, function (equal, ok, step, deepEqual) {
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

  cadence(function (step, ees) {
    step(function () {
      var on = step('on');
      on(ees[0], ees[1], ees[2], 'error', Error);
      on(ees[0], 'end');
    });
  })([ ee, new EventEmitter, new EventEmitter ], function (error) {
    equal(error.message, 'error', 'error event');
  });

  ee.emit('error', new Error('error'));

  cadence(function (step, ees) {
    step(function () {
      var on = step('on');
      on(ees[0], ees[1], ees[2], 'error', Error);
      on(ees[0], 'end');
    }, function (end) {
      equal(end, 'ended', 'errors ignored');
    });
  })([ ee, new EventEmitter, new EventEmitter ], step());

  ee.emit('end', 'ended');

  cadence(function (step, ee) {
    step(function () {
      var on = step('on', ee);
      on('data', []);
      on('end');
    }, function (data, ended) {
      deepEqual(data, [], 'arrayed event with no values');
      equal(ended, 'ended', 'arrayed event with no values ended');
    });
  })(ee, step());

  ee.emit('end', 'ended');

  cadence(function (step, ee) {
    step(function () {
      var on = step('on', ee);
      on('data', [], 2);
      on('end');
    }, function (first, second, ended) {
      deepEqual(second, [], 'arrayed event with specific arity');
      equal(ended, 'ended', 'arrayed event with specific arity ended');
    });
  })(ee, step());

  ee.emit('end', 'ended');

  cadence(function (step) {
    var on = step('on');
    try {
      on(1);
    } catch (e) {
      equal(e.message, 'event name required', 'name required');
    }
  })(step());
});
