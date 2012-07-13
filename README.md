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
***cadence function***.

## Change Log

Changes for each release.

### Version 0.0.6 &mdash; Fri Jul 13 16:27:39 UTC 2012

 * Flatten aguments to inner `cadence` unless first arg is null. #44.

### Version 0.0.5 &mdash; Fri Jul 13 15:25:00 UTC 2012

 * Do not flatten arguments to `async`. #43.
 * Upgrade to Proof 0.0.14. #42.
 * Build on Windows. #41.

### Version 0.0.4 &mdash; Wed Jul 11 21:56:29 UTC 2012

 * No inference when there are no arguments. #40.

### Version 0.0.3 &mdash; Wed Jul 11 00:54:38 UTC 2012

 * Set context after uncaught error. #39.

### Version 0.0.2 &mdash; Sun Jul  8 05:48:38 UTC 2012

 * Remove object merge with cadence context. #38.

### Version 0.0.1 &mdash; Sun Jul  8 04:28:52 UTC 2012

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

### Version 0.0.0 &mdash; Tue Jul  3 19:17:38 UTC 2012

 * Build on Travis CI. #5.
 * Extract Cadence from Proof. #6.
