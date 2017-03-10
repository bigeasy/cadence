## Sat Mar  4 19:20:25 CST 2017 ~ loops

Cadence 3.0 loops.

Either explicit with `async.loop`.

Otherwise, implicit.

### Implicit

For each would once again be invoking the starter with an array as the first
argument.

```javascript
var sum = cadence(function (async, values) {
    async(function (value, index, sum) {
        return sum + value
    })(values, 0)
})

sum([ 1, 2, 3 ], function (error, sum) {
    if (error) throw error
    assert(sum, 6, 'summed')
})
```

To map, we again pass in an array as the first argument and we add an empty
array as the last argument.

```javascript
var multiply = cadence(function (async, factor, values) {
    async(function () {
        return value * factor
    })(values, [])
})

multiply(2, [ 1, 2, 3 ], function (error, mapped) {
    if (error) throw error
    assert.deepEqual(mapped, [ 2, 4, 6 ], 'summed')
})
```

If you want to invoke the loop starter without starting a for each loop but
still pass in arguments, then the loop should be null. You will need to break
the loop yourself.

```javascript
var silly = cadence(function (async, count) {
    async(function (count) {
        if (--count == 0) return [ async.break ]
        else return [ count ]
    })(null, count)
})

silly(function (error) { if (error) throw error })
```

The documentation starts by describing for each and map, then walks back the
array looped over by for each.

Finally, there is an ambiguity with map that has always been there, but if we're
going to pass in `null` to defeat for each, we can pass in `null` to defeat map.

```javascript
var sum = cadence(function (async, values, start) {
    async(function (value, index, sum) {
        return sum + value
    })(values, start, null)
})

sum([ 1, 2, 3 ], 3, function (error, sum) {
    if (error) throw error
    assert.equal(sum, 9, 'summed')
})

sum([ 1, 2, 3 ], [], function (error, sum) {
    if (error) throw error
    assert(isNaN(sum), 'did not map')
})
```

### Optional Labels

For both the implicit and explicit directions, I'd like to make loop labels
optional. Currently they're necessary.

```javascript
var sum = cadence(function (async, values) {
    var sum = 0, index = 0
    var loop = async(function () {
        if (index == values.length) {
            return [ loop.break, sum ]
        }
        sum += values[index]
    })()
})

sum([ 1, 2, 3 ], [], function (error, sum) {
    if (error) throw error
    assert.equal(sum, 6, 'summed')
})
```

`async.break` and `async.continue` would break from the current loop.

```javascript
var sum = cadence(function (async, values) {
    var sum = 0, index = 0
    async(function () {
        if (index == values.length) {
            return [ async.break, sum ]
        }
        sum += values[index]
    })()
})

sum([ 1, 2, 3 ], [], function (error, sum) {
    if (error) throw error
    assert.equal(sum, 6, 'summed')
})
```

### Explicit

Now that I've laid out implicit, explicit is the same but with names to
distinguish `loop`, `forEach` and `map`.

For each is pretty much the same.

```javascript
var sum = cadence(function (async, values) {
    async.forEach(function (value, index, sum) {
        return sum + value
    })(values, 0)
})

sum([ 1, 2, 3 ], function (error, sum) {
    if (error) throw error
    assert(sum, 6, 'summed')
})
```

Mapping is called by name, no special array sigil.

```javascript
var multiply = cadence(function (async, factor, values) {
    async.map(function () {
        return value * factor
    })(values)
})

multiply(2, [ 1, 2, 3 ], function (error, mapped) {
    if (error) throw error
    assert.deepEqual(mapped, [ 2, 4, 6 ], 'summed')
})
```

Invoking a loop with parameters means calling loop and invoking a primer.

```javascript
var silly = cadence(function (async, count) {
    async.loop(function (count) {
        if (--count == 0) return [ async.break ]
        else return [ count ]
    })(count)
})

silly(function (error) { if (error) throw error })
```

No ambiguities between `forEach` and `map` to resolve.

Labels are still available. Also, note that you don't have to invoke the loop
primer if you're not priming.

```javascript
var sum = cadence(function (async, values) {
    var sum = 0, index = 0
    var loop = async.loop(function () {
        if (index == values.length) {
            return [ loop.break, sum ]
        }
        sum += values[index]
    })
})

sum([ 1, 2, 3 ], [], function (error, sum) {
    if (error) throw error
    assert.equal(sum, 6, 'summed')
})
```

Labels are still optional.

```javascript
var sum = cadence(function (async, values) {
    var sum = 0, index = 0
    async.loop(function () {
        if (index == values.length) {
            return [ async.break, sum ]
        }
        sum += values[index]
    })
})

sum([ 1, 2, 3 ], [], function (error, sum) {
    if (error) throw error
    assert.equal(sum, 6, 'summed')
})
```

## Sat Mar  4 19:00:46 CST 2017 ~ loops, concerns, decisions

Considering some changes for a Cadence 3.0 with the notion of of going one
direction or another with loops.

The direction I set out to go was to replace the loop starter function with with
an explicit `async.loop` method that takes a cadence definition.

Muddled thinking at first that this implementation is somehow costly. As always,
I run down my muddle so that at some point I might see how my thought process
works. It bothered me that I'd still have to return a loop starter in order to
provide argumnets to the loop. It seems liked I was adding complexity and
computation. The sentiment was that, ugh, that function that is also an object
with meaningful properties is still there, and I after I added things too, so
there must be more stuff.

It occurs to me now though, that I'd no longer be returning a loop stater from
every cadence declaration. That would save a great many moments, I'm sure.

## Fri Mar  3 22:57:15 CST 2017 ~ loops

Loops could use break and continue and default to looping and breaking from the
Cadence so that there is no error. Then we can have `async.loop`. We can
simplify the default label by assigning it to the `Cadence` object, which we are
doing already anyway, you pass in the loop label.

```
async.loop(function () {
    return [ async.break ]
})
```
