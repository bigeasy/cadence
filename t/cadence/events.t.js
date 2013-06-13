#!/usr/bin/env node

require('proof')(7, function (equal, ok, step, deepEqual) {
  var  EventEmitter = require('events').EventEmitter,
       cadence = require('../..'), ee;

  ee = new EventEmitter();

  cadence(function (step, ee) {
    step(function () {
      ee.on('data', step.event([]));
      ee.on('end', step.event());
    }, function (data) {
      deepEqual(data, [ 1, 2, 3 ], 'events');
    });
  })(ee, step());

  ee.emit('data', 1);
  ee.emit('data', 2);
  ee.emit('data', 3);

  ee.emit('end');

  ee = new EventEmitter();

  cadence(function (step, ee) {
    step(function () {
      ee.on('error', step.error());
      ee.on('end', step.event());
    });
  })(ee, function (error) {
    equal(error.message, 'error', 'error event');
  });

  ee.emit('error', new Error('error'));

  ee = new EventEmitter();

  cadence(function (step, ees) {
    step(function () {
      ee.on('error', step.error());
      ee.on('end', step.event());
    }, function (end) {
      equal(end, 'ended', 'error ignored');
    });
  })([ ee, new EventEmitter, new EventEmitter ], step());

  ee.emit('end', 'ended');

  ee = new EventEmitter();

  cadence(function (step, ee) {
    step(function () {
      ee.on('data', step.event([]));
      ee.on('end', step.event());
    }, function (data, ended) {
      deepEqual(data, [], 'arrayed event with no values');
      equal(ended, 'ended', 'arrayed event with no values ended');
    });
  })(ee, step());

  ee.emit('end', 'ended');

  ee = new EventEmitter();

  cadence(function (step, ee) {
    step(function () {
      ee.on('data', step.event(2, []));
      ee.on('end', step.event());
    }, function (first, second, ended) {
      deepEqual(second, [], 'arrayed event with specific arity');
      equal(ended, 'ended', 'arrayed event with specific arity ended');
    });
  })(ee, step());

  ee.emit('end', 'ended');
});
