## Thu Nov 22 01:48:19 CST 2018

We revisit Cadence 3.0 loop primers. Must about the cost of labels. Consider the
difference between breaking from loops and breaking from cadences.

### Explicit Loop Primers

In our last experiment with explicit loops we preserved the use of a function
returned from the cadence creation function call as the optional primer for the
loop.

```javascript
var silly = cadence(function (async, count) {
    async.loop(function (count) {
        if (--count == 0) return [ async.break ]
        else return [ count ]
    })(count)
})

silly(function (error) { if (error) throw error })
```

Because the loop primer is optional, the returned function is not always
necessary. The fact that the primer is placed at the end of the declaration
makes it somewhat difficult to read. Wouldn't it make more sense to display the
start of the loop with the primer arguments right next to the first step
function signature?

```javascript
var silly = cadence(function (async, count) {
    async.loop([ 0 ], function (count) {
        if (--count == 0) return [ async.break ]
        else return [ count ]
    })
})

silly(function (error) { if (error) throw error })
```

With the primary right next to the first step, you might immediately see the
argument passed from one iteration of the loop to the next with its initial
value, then read through a lot of code knowing that it is going to end with the
next loop value, but on your very first read of the code you'll have an example
argument value in the form of the primer value.

We obviously create some ambiguity when we do not provide a primer but our first
step is a finalizer or a try/catch. We might either require the primer, or else
we have to document the ambiguity and hope that our dear user does not find it
to be too magical.

For the sake of consistency, which I'm sure our dear user will prize, we should
make `async.map` and `async.forEach` accept the array they operate on as the
first argument of an arguments array.

```javascript
var sum = cadence(function (async, values) {
    async.forEach([ values, 0 ], function (value, index, sum) {
        return sum + value
    })
})

sum([ 1, 2, 3 ], function (error, sum) {
    if (error) throw error
    assert(sum, 6, 'summed')
})
```

Such a departure form the seemingly anonymous parenthesis at the end of our
cadences, and with all the muddle of creating an array as an to each loop solely
for the purpose of grouping those variadic arguments. A little jangly
aesthetically, but no performance cost, since with the primer function we'd have
to convert the `arguments` of the primer function to a proper `Array` so it
could be stored until we're ready to start the loop by calling the first step
with the `Array` using `Function.apply`.

### Breaking from Cadences

I'd imagined that I'd had some way to distinquish between breaking from a
the immeidate cadence and breaking from a loop. In practice, it always does what
I expect it to do, but it appears that this might be a matter of luck.

It appears that with `async.break` we do break out of the outer-most loop, not
the inner-most and not the immediate cadence. With our new looping logic,
`async.break` will always break out of the the inner most loop. To break out of
an outer loop you would use a loop label.

```javascript
var grep = cadence(function (async, dirs, re) {
    var search = async.loop([], function () {
        if (dirs.length == 0) {
            return [ async.break, null ] // breaks from `search`
        }
        var dir = dirs.shift()
        async(function () {
            fs.readdir(dirs.shift(), async())
        }, function (files) {
            async.loop([], function () {
                if (files.length == 0) {
                    return [ async.break ] // breaks from file loop
                }
                fs.stat(files[0], async())
            }, function (stat) {
                var file = path.resolve(files.shift(), dir)
                if (stat.isDirectory) {
                    dirs.push(file)
                } else {
                    async(function () {
                        fs.readFile(file, 'utf8', async())
                    }, function (body) {
                        if (re.test(body)) {
                            return [ search.break, file ] // breaks from `search`
                        }
                    })
                }
            })
        })
    })
})

grep(\_\_dirname, /function/, function (error, file) {
    if (error) throw error
    console.log(file)
})
```

The above example is a function that searches through files and returns the
first file that matches the regular expression, thus breaking from the inner
loop of files.

### Breaking form the Immediate Cadnece

My idea for breaking from a cadence as opposed to a loop is to use
`async.return`, but I'm starting to wonder if this is every really necessary. If
I did need to break I could use the new `async.block` concept described below,
but don't I usually want to continue a loop?

```javascript
var f = cadence(function (async) {
    async(function () {
        async([function () {
            fs.readFile('config.json', 'utf8', async())
        }, function (error) {
            return [ async.return, {} ]
        }], function (body) {
            return JSON.parse(body)
        })
    }, function (config) {
        config.size || (config.size = 256)
        return config
    })
})
```

In the above example `async.break` would cause the function to return early. You
could return `{}` from the catch block and have it parsed, which is something
I've done in the past, but the above seems to be a real life example, valid and
useful.

### Cost of Labels

There are times when you want a label but no loop. We'll look for this in our
existing code after the refactor. It is not common. It might be because there is
no good way to break form the immediate cadence when there's an exception, but
that might not be too common either.

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

Now we have an amibuity when we want to pass parameters to a for each when the
last parameter could potentially be an array value. In early days of Cadence
before named `forEach` and `map` this ambiguity seemed irreconcilable. It is one
of the reasons why I opted for named `forEach` and `map`. They way I see code
today, however, ambiguity resolution is as simple as instructing our dear user
to pass a `null` literal as a last parameter to defeat mapping.

TK This is an example of defeating map and getting garbage out of a function
that uses map. What we really want is a for each function that makes good use of
an array, maybe we loop over an array building an object using another array as
an indexOf lookup of valid members.

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

TK Better example. Try to find better values. Ugh. Why would you pass the array
in though? Makes the point that this is an ambiguity that is never encounted.

```javascript
var byDepartment = cadence(function (async, employees, departments) {
    var grouped = {}
    async(function (value, index, departments) {
        if (~departments.indexOf(employee.department)) {
            var department = grouped[employee.department]
            if (department == null) {
                department = grouped[employee.department] = []
            }
            department.push(employee)
        }
    })(employees, departments, null)
})

byDepartment(employees, [ 'shipping', 'accounting' ], function (error, sum) {
    if (error) throw error
    assert(employees['shipping'].length > 0, 'have some shipping staff')
    assert(employees['accounting'].length > 0, 'have some accounting staff')
})

byDepartment(employees, [], function (error, sum) {
    if (error) throw error
    assert.equal(employees.length, 0, 'no staff')
})
```

TK Having written that it could be as simple as: `filter(array, array,
callback)`, oh, duh, 'union' and 'difference'. Hmm... And if the reduced result
is the reduced array, the difference array. Okay, come back to this.

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
