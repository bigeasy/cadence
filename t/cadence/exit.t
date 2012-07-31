#!/usr/bin/env node

require('proof')(2, function (async, ok, equal) {
  var fs = require('fs')
    , cadence = require('../..')
    , one = async(), two = async()
    ;

  cadence(function (async) {

    async(null, 1);

  }, function () {

    ok(false, 'should not be called');

  })(function (error, number) {
    
    if (error) throw error;
    equal(number, 1, 'early return');
    one();

  });

  cadence(function (async) {

    async(new Error('abend'));

  }, function () {

    ok(false, 'should not be called');

  })(function (error) {
    
    if (error.message != 'abend') throw error;
    equal(error.message, 'abend', 'early return with error');
    two();

  });
});
