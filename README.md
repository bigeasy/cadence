# Cadence [![Build Status](https://secure.travis-ci.org/bigeasy/cadence.png?branch=master)](http://travis-ci.org/bigeasy/cadence)

A Swiss Army asynchronous control flow function for JavaScript.

```javascript
var cadence = require('cadence'), fs = require('fs');

cadence(function (step) {

  fs.readFile(__filename, 'utf8', step());

}, function (body) {

  console.log(body);

})();
```

Cadence takes a series of functions and runs them in serial. We call the series
of functions a ***cadence***. We call an individual function in a cadence a
***step***.

A step can contain a sub-cadence. We can run multiple sub-cadences in parallel.
With this, you've got your serial and your parallel, and you mix or match to
create the asynchronous program you want to run.

Cadence is a function generator that creates a `step` function that accepts a
conventional Node.js error, results callback function. You can then use the
generated function anywhere in your code.

```javascript
var cadance = require('cadence'), fs = require('fs');

var deleteIf = cadence(function (step, file, condition) {
  fs.stat(file, step());
}, function (step, stat) {
  if (condition(stat)) fs.unlink(step());
});

function empty (stat) { return stat.size == 0 }

deleteIf(__filename, empty, function (error) {
  if (error) console.log(error);
});
```

In the above example we create a function that will asynchronously stat a file,
then if a test function passes, it will asynchronously delete the file. We
assign our cadence to a variable named `deleteIf`. We can now call `deleteIf`
providing a standard issue Node.js error reporting callback.

Let's extend our `deleteIf` function. Let's say that if the file doesn't exist,
we ignore the error raised when we stat the file. If we pass `Error` to our
`step` constructor, the next function in an error handler function. The error
handler function will be called with the `error` as the first argument if an
error is returned. If there is no error, the error handler function is skipped.

```javascript
var cadance = require('cadence'), fs = require('fs');

var deleteIf = cadence(function (step, file, condition) {
  fs.stat(file, step(Error));
}, function (error) {
  if (error.code != "ENOENT") throw error;
  else step(null);
}, function (step, stat) {
  if (stat && condition(stat)) fs.unlink(step());
});

function empty (stat) { return stat.size == 0 }

deleteIf(__filename, empty, function (error) {
  if (error) console.log(error);
});
```

We test to see if the error is `ENOENT`. If not, we have a real problem, so we
throw the error. The cadence stops and the callback is called with error. The
error is `ENOENT`, we exit early by calling the step function directly as a
callback, passing `null` to indicate no error.

## Working with `EventEmitter`s

Here is a unit test for working with `EventEmitter` illustrating the
`once` handler.

```javascript
var cadence = require('cadence'), event = require('event')
  , emitter = new event.EventEmitter();

cadence(function (emitter, step) {
  step(function () {
    step(emitter).once('end');
  }, function (end) {
    assert.equal(end, 'done');
  });
})(emitter);

emitter.emit('end', 'done');
```

When you invoke `once` an inverse future is created that collects the
emitted event value. Cadence will wait until the `once` value is emitted
before continuing to the next step. The value will be assigned to the
cadence context using the event name as a variable name.

Unlike the `once` handler, the `on` handler does not block the next step
in the cadence.

```javascript
var cadence = require('cadence'), event = require('event')
  , emitter = new event.EventEmitter();

cadence(function (emitter, step) {
  step(function () {
    step(emitter).once('end');
  }, function (data) {
    assert.deepEqual(data, [ 1, 2, 3 ]);
  });
})(emitter);

emitter.emit('end', 'done');
```

When you invoke `on`, the results will be gathered in an array in the
cadence context, keyed by the name of the event. The callback will
gather results until the final callback for the step function is
invoked.

**TODO**: Currently there is no support for events that emit more than
one argument. You can +1 [this
issue](https://github.com/bigeasy/cadence/issues/50) if this is blocking
your project.

Below we use the example of splitting an HTTP server log for many hosts
into a log file for each host.

```javascript
var cadence = require('cadence'), fs = require('fs');

cadence(function (step) {
  step(function () {
    var readable = fs.readableStream(__dirname + '/logins.txt');
    readable.setEncoding('utf8');
    step(readable).on('data').once('end');
  }, function (data) {
    var hosts = {};
    data.join('').split(/\n/).foreach(function (line) {
      var host = /^([\w\d.]+)\s+(.*)/.exec(line)[1];
      (hosts[host] || (hosts[host])).push(line);
    });
    for (var host in hosts) {
      var writable = fs.writableStream(__dirname + '/' + host + '.log');
      writable.end(hosts[host].join('\n') + '\n');
      step(writable).once('drain');
    }
  });
})();
```

## Change Log

Changes for each release.

### Version 0.0.12

Sat Mar 16 05:35:06 UTC 2013

 * Propagate `` this ``. #84.
 * Use identity operator in check for early return. #82.
 * Build `` callback `` object in ``` _async ```.
 * Rename `arguments` property to `args`.
 * Move sizes indent from `t/sizes` to `t/test`.
 * More tests for fix-up cadences.
 * Remove `if` statement to test for invoke callback. #66.
 * Fix cadence return values. #76.
 * Fix arity.
 * Remove hidden context. #75.
 * Remove timeouts. #80.
 * Use `Error` to indicate subsequent error handler. #68.
 * Remove wrap option. #78.
 * Remove "use strict".
 * Ensure reentrancy. #74.
 * Remove underscore to indicate zero arity. #73.

### Version 0.0.11

Tue Mar 12 07:50:52 UTC 2013

 *  Make default arity of scalars zero. #71.

### Version 0.0.10

Tue Mar 12 05:57:10 UTC 2013

 * Drop support for parameter inferred plain callbacks. #70.
 * Implement zero-to-many callback functions. #62.
 * Spell check and tidy prose. #69. #65.
 * Implement arrayed sub-cadences. #64.
 * Implement fix-up cadences. #61.
 * Fix snuggled parameters. #60.
 * Created a design document in `design.markdown`.

### Version 0.0.9

Released: Sat Mar  9 04:06:57 UTC 2013

 * New logic to specify order of parameters to subsequent function. #58.

### Version 0.0.8

Released: Mon Mar  4 06:56:26 UTC 2013

 * Rename `async` function to `step`. #55.
 * Exception when `step` arguments are invalid. #56.

### Version 0.0.7

Released: Wed Feb 27 00:33:51 UTC 2013

 * Step over to stop out of `async`. #47.
 * Add `.js` suffix to test file names. #54.
 * Update `t/sizes` and `t/test` to work with a POSIX shell.
 * Return `cadence` function directly instead of factory function. #49.
 * Moved `build` directory contents to `t`. #51.
 * Rename inner `cadence` function to `async`. #52.
 * Consume events from event emitters. #48.
 * An `` _ `` underbar as a step function name means to disable argument
   inference. #46. #25

### Version 0.0.6

Released: Fri Jul 13 16:27:39 UTC 2012

 * Flatten arguments to inner `cadence` unless first arg is null. #44.

### Version 0.0.5

Released: Fri Jul 13 15:25:00 UTC 2012

 * Do not flatten arguments to `async`. #43.
 * Upgrade to Proof 0.0.14. #42.
 * Build on Windows. #41.

### Version 0.0.4

Released: Wed Jul 11 21:56:29 UTC 2012

 * No inference when there are no arguments. #40.

### Version 0.0.3

Released: Wed Jul 11 00:54:38 UTC 2012

 * Set context after uncaught error. #39.

### Version 0.0.2

Released: Sun Jul  8 05:48:38 UTC 2012

 * Remove object merge with cadence context. #38.

### Version 0.0.1

Released: Sun Jul  8 04:28:52 UTC 2012

 * Test case for Proof set context. #35.
 * Variadic and external arguments. #34. #31.
 * Store ephemeral variables outside of cadence context. #33.
 * Pass parameters in from external function. #23.
 * Create change log. #32.
 * Return values to application. #14.
 * Early exit. #30.
 * Plain old callbacks. #29.
 * Immediate context assignment within step function. #28.
 * Application specified base context. #27.
 * Application specified alias for `cadence`. #16.
 * Error-only error handling step functions. #26.
 * Handle errors from parallel asynchronous calls. #8.
 * Branching. #24. #2.
 * Add Travis CI chicklet to `README.md`. #11.
 * Track minified size in Travis CI builds. #22. #21.
 * Parallel sub-cadences. #19.
 * Cadence context as stack. #4.
 * Application specified step function wrappers. #3.
 * Fix `README.md` examples. #9.
 * Build a Node.js style asynchronous function. #13.
 * Catch-all exception handling. #1&. #12.
 * Rename test directories. #15.
 * Gather results from parallel executions. #10.
 * Infer context names from step function argument names. #7.

### Version 0.0.0

Released: Tue Jul  3 19:17:38 UTC 2012

 * Build on Travis CI. #5.
 * Extract Cadence from Proof. #6.
