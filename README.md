# Cadence [![Build Status](https://secure.travis-ci.org/bigeasy/cadence.png?branch=master)](http://travis-ci.org/bigeasy/cadence)

A Swiss Army asynchronous control flow function for JavaScript.

```javascript
var cadence = require('cadence')()
  , fs = require('fs')
  ;

cadence(function (cadence) {

  fs.readFile(__filename, 'utf8', cadence());

}, function (body) {

  console.log(body);

})();
```

Cadence takes a series of functions and runs them in serial. We call the series
of functions a ***cadence***. We call an individual function in a cadence a
***step***.

Cadence is a function generator that creates an asynchronous function that
accepts a conventional Node.js error, results callback function. You can then
use the generated function anywhere in your code.

```javascript
var cadance = require('cadence')() // create a cadence function
  , fs = require('fs')
  ;

var deleteIf = cadence(function (cadence, file, condition) {
  fs.stat(file, cadence());
}, function (cadence, stat) {
  if (condition(stat)) fs.unlink(cadence());
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
we ignore the error raised when we stat the file. If we add a step function that
takes `error` as it's first argument, it is called only if an error has occured
in the previous step.

```javascript
var cadance = require('cadence')() // create a cadence function
  , fs = require('fs')
  ;

var deleteIf = cadence(function (cadence, file, condition) {
  fs.stat(file, cadence());
}, function (error) {
  if (error.code != "ENOENT") throw error;
}, function (cadence, stat) {
  if (stat && condition(stat)) fs.unlink(cadence());
});

function empty (stat) { return stat.size == 0 }

deleteIf(__filename, empty, function (error) {
  if (error) console.log(error);
});
```

We test to see if the error is `ENOENT`. If not, we have a real problem, so we
throw the error. The cadence stops and the callback is called with error. The
error is `ENOENT`, we move onto the next step.

If there is no error, the error handling step is not called, so we do not have
to check to see if `error` is null. We do need to see if `stat` is null,
however.
