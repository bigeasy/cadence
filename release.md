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

### Issue by Issue

 * Boolean indicates loop termination on truthiness. #158.
