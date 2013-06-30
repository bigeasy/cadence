# Cadence [![Build Status](https://secure.travis-ci.org/bigeasy/cadence.png?branch=master)](http://travis-ci.org/bigeasy/cadence) [![Coverage Status](https://coveralls.io/repos/bigeasy/cadence/badge.png?branch=master)](https://coveralls.io/r/bigeasy/cadence) [![NPM version](https://badge.fury.io/js/cadence.png)](http://badge.fury.io/js/cadence)

A Swiss Army asynchronous control flow function builder for Node.js and
JavaScript that helps you create highly-parallel control flows.

Cadence is a function builder. It simplifies the writing of asynchronous
functions of that accept and  error/result callback using a domain specific
language of sorts.

```javascript
// Use Cadence.
var cadence = require('cadence'), fs = require('fs');

// Create an asynchronous function.
var cat = cadence(function (step) {
  step(function () {

    fs.readFile(__filename, 'utf8', step());

  }, function (body) {

    console.log(body);

  });
})

// Use it in your program.
cat(function (error) { if (error) throw error });
```

You create a function by passing a function to `cadence` that creates cadences.

We call the series of functions a ***cadence***. We call an individual function
in a cadence a ***step***. We use the `step` function to both define cadences
and to create the callbacks that will take us from one step to another.

The functions in a cadence are run in **serial**. A step inside a cadence can
contain callbacks whose return values appear in the next step or sub-cadences.
The callbacks and sub-cadences in a step are run in **parallel**. You can run
multiple sub-cadences in parallel. With this, you've got your serial and your
parallel, and you mix or match to create your asynchronous program.

Documentation is a work in progress. Here is the current word count.

```console
  425  1982 12935 README.md
```

 * Arrayed sub-cadences.
 * Arity.
 * Fixup cadences.
 * Jumping.
 * Finalizers.

### Accepting Arguments

Here's an example of a function built by Cadence that accepts arguments.

```javascript
// Use Cadence.
var cadance = require('cadence'), fs = require('fs');

// Delete a file if the condition is true.
var deleteIf = cadence(function (step, file, condition) {
  step(function () {
    fs.stat(file, step());
  }, function (stat) {
    if (condition(stat)) fs.unlink(step());
  });
});

// Test to see if a file is empty.
function empty (stat) { return stat.size == 0 }

// Delete a file if it is empty.
deleteIf(__filename, empty, function (error) { if (error) throw error });
```

In the above example we create a function that will asynchronously stat a file,
then if a test function passes, it will asynchronously delete the file. We
assign our cadence to a variable named `deleteIf`. We can now call `deleteIf`
providing a standard issue Node.js error reporting callback.

### Sub-Cadences

Let's say that we want to get a `stat` object, but include the body of the file
in the `stat` object. When we get out `stat` object, we can use a sub-cadence to
complete the `stat` object by reading the body.

```javascript
var cadance = require('cadence'), fs = require('fs');

// Stat a file and add the file body to the stat.
var bodyStat = cadence(function (step, file, condition) {
  step(function () {

    fs.stat(file, step());

  }, function (stat) {

    // We create a sub-cadence here because we want to work with `stat`. The
    // `stat` object is in scope for all the function in the sub-cadence.
    step(function () {

      fs.readFile(file, step());

    }, function (body) {

      stat.body = body;
      return stat; // return value of both the sub-cadence and the step that
                   // created the cadence. See more below.

    });
  });
});

// Delete a file if it is empty.
statBody(__filename, function (error) {
  if (error) throw error
  process.stdout.write('content-length: ' + stat.size + '\n\n');
  process.stdout.write(stat.body.toString('utf8'));
});
```

TK: Take the above example and say; the sub-cadence return is the first argument
to the next function. Use a stupid assertion `ok(body.length == size)`.

### Subsequent Arguments

When you create callbacks in a Cadence step, the results are passed onto the
subsequent step. The order of the callbacks determines the order of of the
arguments.

```javascript
cadence(function () {
  step(function () {

    var first = step();
    var second = step();

    second(null, 2);
    first(null, 1);

  }, function (a, b) {

    equal(a, 1, "first");
    equal(b, 2, "second");

  });
});
```

NOTE: Documentation pro-tip: Create examples sooner than later and then
reference the examples in your wiring.

In the above example, observe that the declaration order determines argument
order, not the order of invocation of the callbacks. Even if `second` is called
back before `first`, the argument to first the subsequent step is invoked with
results of `first` as the first argument `a`,`second` as the second argument
`b`.

TK: More words and examples here.
TK: Example using `fs`.
TK: Always use an initial sub-cadence in the `README.md` so people don't get to
thinking that it is something to be avoided.
TK: In the sub-cadence example, talk about scope and closure.

### Catching Errors

Because Cadence courages parallelism, it's error handling mechanism deals with
arrays of errors, all the errors that could possibly be caught. However, your
caller is expecting one single error, so the default behavior for cadence is to
return the first error, then cancel any cadences at their next function.

The cancellation is why we have finalizers, to make sure that you release any
resources. A finalizer is invoked.

Cadence catches errors using a try/catch pair of functions. The functions are
grouped in an array. The array brackets that signify the try and catch format
nicely in to the list of step function that compose a cadence.

Let's extend our `deleteIf` function. Let's say that if the file doesn't exist,
we ignore the error raised when we stat the file. To catch the error we wrap our
call to `stat`. If the file doesn't exist, our catch function is called with the
`Error`. If it is an `"ENOENT"` error, the file doesn't exist, so we exit the
cadnece early returning `false`. If it is not an `"ENOENT"` error, then some
other error occured so we re-throw the error.

```javascript
// Use Cadence.
var cadance = require('cadence'), fs = require('fs');

// Delete a file if it exists and the condition is true.
var deleteIf = cadence(function (step, file, condition) {
  step([function () {
    fs.stat(file, step());
  }, function (error) {
    // TK: Early return example can be if it is a directory, return early.
    if (error.code != "ENOENT") throw error;
    else step(null);
  }], function (stat) {
    if (stat && condition(stat)) fs.unlink(step());
  });
});

// Test to see if a file is empty.
function empty (stat) { return stat.size == 0 }

// Delete a file if it exists and is empty.
deleteIf(__filename, empty, function (error) { if (error) throw error });
```

We test to see if the error is `ENOENT`. If not, we have a real problem, so we
throw the error. The throw is caught and forwarded to the callback that invoked
the cadence function.

If the error is `ENOENT`, we exit early by calling the step function directly as
a if it were itself an error/result callback, passing `null` to indicate no
error.

## Working with Events.

Cadence also works with event emitting objects that do not accept an error as
the first parameter. These are event mechanisms like the DOM events or the
events generated by the Node.js `EventEmitter`.

Here is a unit test for working with `EventEmitter` illustrating the use of
events in Cadence.

```javascript
var cadence = require('cadence'), event = require('event')
  , ee = new event.EventEmitter();

cadence(function (step, ee) {
  step(function () {
    ee.on('data', step.event([]));
    ee.on('end', step.event());
    ee.on('error', step.error());
  }, function (data) {
    assert.deepEqual(data, [ 1, 2, 3 ]);
  });
})(emitter);

ee.emit('data', 1);
ee.emit('data', 2);
ee.emit('data', 3);

ee.emit('end');
```

Below we use the example of splitting an HTTP server log for many hosts
into a log file for each host.

```javascript
var cadence = require('cadence'), fs = require('fs');

cadence(function (step) {
  step(function () {
    var readable = fs.readableStream(__dirname + '/logins.txt');
    readable.setEncoding('utf8');
    readable.on('data', step.event([]));
    readable.on('end');
  }, function (data) {
    var hosts = {};
    data.join('').split(/\n/).foreach(function (line) {
      var host = /^([\w\d.]+)\s+(.*)/.exec(line)[1];
      (hosts[host] || (hosts[host])).push(line);
    });
    for (var host in hosts) {
      var writable = fs.writableStream(__dirname + '/' + host + '.log');
      writable.end(hosts[host].join('\n') + '\n');
      writable.on('drain', step.event());
    }
  });
})();
```

This is a horrible example. Try again.

## Control Flow

Here is where you would discuss `step.jump` and the function index.

## Change Log

Changes for each release.

### Version 0.0.19

Tue Jun 18 22:03:00 UTC 2013

 * Change function index of calling cadence from sub-cadence. #104.

### Version 0.0.18

Mon Jun 17 17:43:13 UTC 2013

 * Create a named function to jump within the cadence. #102.

### Version 0.0.17

Thu Jun 13 23:40:08 UTC 2013

 * Fix arrayed event handlers. #100.

### Version 0.0.16

Thu Apr 25 02:48:25 UTC 2013

 * Measure test coverage using Istanbul and report test coverage using
   Coveralls. #94. #95.
 * Rework event building into the `step.event` and `step.error` functions #99.
 * Fix global variable namespace leak.
 * Test with Node.js 0.10.
 * Add support for Bower. #93.
 * `README.md` editing. #92.

### Version 0.0.15

Thu Mar 21 08:33:24 UTC 2013

 * Handle errors from sub-cadences. #79.
 * Specify zero-to-many in `step` constructor, not in arry constructor. #81.
 * Tidy `.gitignore`.
 * Set arity and specify arity of event handlers. #91.

### Version 0.0.14

Thu Mar 21 05:16:29 UTC 2013

 * Handle error events. #89. #83.
 * Use strings to indicate an event handler. #63. #50.
 * Shift arguments for callbacks with no error message. #85.

### Version 0.0.13

Sun Mar 17 06:24:14 UTC 2013

 * Check for error handler on fix-up cadence error. #88.
 * Check for error handler on sub-cadence error. #86.
 * Add contribution guide.
 * Upgrade Proof to 0.0.23.

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
