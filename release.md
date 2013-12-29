Now you can indicate that a loop should terminate when a result is truthy or
falsey. This can be used with iterators that return `null` to terminate loops.

```
cadence(function (step, iterator) {
    var records = []
    step(function () {
        step(function () {
            iterator.next(step(false))
        }, function (value) {
            records.push(value)
        })()
    })
})
```

In the above, the terminal condition is when the return value is falsey. We've
not had a use for the boolean yet, so let's try this out.

When you specify a string, you now specify a property assignment. The first
return value is assigned to the `this` object.

```javascript
var object = {}, fs = require('fs'), ok = require('assert').ok

object.method = cadence(function (step, value) {
    step(function () {
        fs.readFile(__filename, 'utf8', step('body'))
    }, function (body) {
        return this.body == body
    })
})

object.method(1, function (error, result)  {
    ok(result, 'this.body equals body')
})
```

The property assignment does not prevent the value from being returned as normal.

### Issue by Issue

 * String indicates a property assignment. #157.
 * Boolean indicates loop termination on truthiness. #158.
