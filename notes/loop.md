Refactored basic loops.

Explicitly labeled. Looks like `map` and `forEach`.

```javascript
cadence(function (async) {
    var count = 0
    async.loop(function () {
        if (count++ == 10) {
            return [ async.break ]
        }
    })
})
```

The `async.break` now breaks from a loop, but it also creates an error
condition where there may not be a loop to break from. Maybe instead of raising
an exception, it is well enough to do nothing. Maybe it falls back to a cadence
exit.

We still have labels if we need to break out of a specific loop.

```javascript
cadence(function (async) {
    var count = 0
    var loop = async.loop(function () {
        if (count++ == 10) {
            return [ loop.break ]
        }
    })
})
```

This is probably the nicest looking bit.

```javascript
cadence(function (async) {
    async.loop(function (count) {
        if (count == 10) {
            return [ async.break ]
        }
        return [ count++ ]
    })(count)
})
```

I'm not all that excited about this.
