# Cadence

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
