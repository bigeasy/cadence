#!/usr/bin/env node

require('proof')(15, function (step, deepEqual, equal, ok) {
  var cadence = require('../..');

  cadence(function (step) {

    step(function () {
      step()(null);
      step()(null, 1);
    }, function (x) {
      equal(x, 1, 'default is zero');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      step(function () {
        step()(null, 1, 2);
      });
    }, function (one, two) {
      equal(one, 1, 'sub-cadence inferred one');
      equal(two, 2, 'sub-cadence inferred two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      step(1, function () {
        step()(null, 1, 2);
      });
      step()(null, 3);
    }, function (one, two) {
      equal(one, 1, 'sub-cadence specified one');
      equal(two, 3, 'sub-cadence specified two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      [ 1, 2, 3 ].forEach(step([], function (number) {
        step()(null, number, number + 1);
      }));
    }, function (one, two) {
      deepEqual(one, [ 1, 2, 3 ], 'arrayed sub-cadence step inferred one');
      deepEqual(two, [ 2, 3, 4 ], 'arrayed sub-cadence step inferred two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      [ 1, 2, 3 ].forEach(step(1, [], function (number) {
        step()(null, number, number + 1);
      }));
      step(1)(null, 2);
    }, function (one, two) {
      deepEqual(one, [ 1, 2, 3 ], 'arrayed sub-cadence specified one');
      equal(two, 2, 'arrayed sub-cadence specified two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      var items = step([]);
      [ 1, 2, 3 ].forEach(function (number) {
        items()(null, number, number + 1);
      });
    }, function (one, two) {
      deepEqual(one, [ 1, 2, 3 ], 'arrayed step inferred one');
      deepEqual(two, [ 2, 3, 4 ], 'arrayed step inferred two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      var items = step(1, []);
      [ 1, 2, 3 ].forEach(function (number) {
        items()(null, number, number + 1);
      });
      step()(null, 2);
    }, function (one, two) {
      deepEqual(one, [ 1, 2, 3 ], 'arrayed step inferred one');
      equal(two, 2, 'arrayed step specified two');
    });

  })(step());

  cadence(function (step) {

    step(function () {
      step(step, 1, function (numbers) {
        numbers.forEach(step(1, [], function (number) {
          step()(null, number, number + 1);
        }));
      })(null, [ 1, 2, 3 ]);
      step(step, function (number) { return number + 1 })(null, 2);
    }, function (one, two) {
      deepEqual(one, [ 1, 2, 3 ], 'fixed-up step inferred one');
      equal(two, 3, 'fixed-up step specified two');
    });

  })(step());
});
