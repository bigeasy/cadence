#!/usr/bin/env node

require('proof')(12, function (equal, ok) {
  var fs = require('fs')
    , cadence = require('../..')
    ;

  var object = {};

  // Simple example of a finalizer.
  cadence(function (step, object) {

    step([function () {
      ok(object.used, 'leading finalizer closed');
      object.closed = true;
    }], function () {
      ok(!object.closed, 'leading finalizer open');
      object.used = true;
      return object;
    });

  })({}, function (error, object) {
    if (error) throw error;
    ok(object.used, 'leading finalizer was used'); 
    ok(object.closed, 'leading finalizer was closed'); 
  });

  // Fixup finalizers run in the parent cadence.
  cadence(function (step, object) {

    step(function () {
      ! function (callback) {
        callback(null, object);
      } (step(step, [function (object) { object.closed = true }]));
    }, function (object) {
      ok(!object.closed, 'leading finalizer open');
      object.used = true;
      return object;
    });

  })({}, function (error, object) {

    if (error) throw error;
    ok(object.used, 'leading finalizer was used'); 
    ok(object.closed, 'leading finalizer was closed'); 

  });

  // Fixup finalizers run after explicit exit.
  cadence(function (step, object) {

    step(function () {
      ! function (callback) {
        callback(null, object);
      } (step(step, [function (object) { object.closed = true }]));
    }, function (object) {
      ok(!object.closed, 'leading finalizer open');
      object.used = true;
    }, function () {
      step(null, object);
    });

  })({}, function (error, object) {

    if (error) throw error;
    ok(object.used, 'leading finalizer was used'); 
    ok(object.closed, 'leading finalizer was closed'); 

  });

  // Finalizers report their errors.
  cadence(function (step, object) {

    step(function () {
      ! function (callback) {
        callback(null, object);
      } (step(step, [function (object) { step()(new Error('finalizer')) }]));
    }, function (object) {
      ok(!object.closed, 'leading finalizer open');
      return object;
    });

  })({}, function (error) {

    ok(error.message, 'finalizer', 'finalizer raised error');

  });
});
