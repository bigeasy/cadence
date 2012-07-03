# Cadence

A Swiss Army asynchronous control flow function for JavaScript.

```javascript
var cadence = require('cadence')()
  , fs = require('fs')
  ;

cadence(function (cadence) {

  fs.readFile(__filename, 'utf8', cadence());

}, function (body) {

  ok(/cadence/.test(body), "read");

}, callback());
```
