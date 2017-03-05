Cadence is a control-flow library for error-first callback style of asynchronous
programming. You can reason about asynchronous programming as if it were linear.
Cadence provides an elegant, performant solution to the coding horrors of the
the [Pyramid of
Doom](http://tritarget.org/blog/2012/11/28/the-pyramid-of-doom-a-javascript-style-trap/).

Cadence is one step after another, with robust try/catch error handling,
finalizers, nested asynchronous loops with break and contine, and tail-recursion
elimination to you'll never blow your stack looping.

Link to [diary](./diary.html).

Here's a function that will delete a file if it exists.

```javascript
var cadence = require('cadence')
var fs = require('fs')
var path = require('path')

var deleteIf = cadence(function (async, file) {

    async(function () {

        fs.readdir(path.dirname(file), async())

    }, function (files) {

        if (!files.some(function (f) { return f == file }).length) {
            return [ async, false ]
        }
        fs.unlink(file, async())

    }, function () {

        return [ true ]

    })

})

deleteIf('junk.txt', function (error, deleted) {
    if (error) console.log(error)
    console.log('junk.txt: was deleted ' + deleted)
})
```

Of course that has a race condition, what if the file is deleted after you've
read the directory but before you unlink it? A better way of doing this would be
to try to delete the file, but catch an `ENOENT` error if the file does not
exist.

```javascript
var cadence = require('cadence'), fs = require('fs')

var deleteIf = cadence(function (async, file) {

    var block = async([function () {

        fs.unlink(file, async())        // try

    }, /^ENOENT$/, function () {

        return [ block, false ]         // catch ENOENT

    }], function () {

        return [ true ]                 // deleted

    })()

})

deleteIf('junk.txt', function (error, deleted) {
    if (error) console.log(error)
    console.log('junk.txt: was deleted ' + deleted)
})
```

In the above we use a catch block to catch an `ENOENT` error and return false,
otherwise return true. If an error other than `ENOENT` is raised, the the error
will be passed as the first argument.

### What Cadence Can Do for You

Cadence is pure-JavaScript library control-flow library with no transpilers. The
Cadence kernel is designed to JIT compile and get out of the way.

Cadence can express all manner of asynchronous operations, including:

 * serial asynchronous operations, of course
 * parallel asynchronous operations, naturally
 * `while` loops, `do..while` loops, or `counted` loops
 * each loops that can either map or reduce an array
 * `break` from labeled loops or `continue` them, even up out of nested loops to
   an outer loop
 * asynchronous try and catch exception handling
 * asynchronous finalizers for clean up

Cadence has features that you don't know you want… yet:

 * Have you been bitten by a stack overflow yet? Cadence runs your code in a
   trampoline, so that asynchronous functions that callback in the same tick do
   not add a stack frame.
 * Do you have a strategy to test every one of those `if (error)` branches?
   Cadence handles your erorrs for you and propagates them up and out to the
   user.
 * What about cleaning up after an error? You can't just `if (error)
   callback(error)` if you have files open or databases on the line. Cadence has
   try/catch blocks and finalizers.
 * Who is `this`? With Cadence `this` is consistent all throughout a function
   body. You don't have to `bind(this)` or `var self = this` with Cadence.

You can use Cadence in the browser too. It is not Node.js dependent and it
minzips to ~2.31k.

### Cadence In a Nutshell

Cadence runs a series of functions asynchronously, use the results of one
function as the arguments for the next.

We call the series of functions a **cadence**. We call an individual function in
a cadence a **step**.

We create cadences using the universal builder method `async`. It is a universal
because we also use `async` to create callbacks for asynchronous functions.

```javascript
// `cat`: write a file to standard out.
var cat = cadence(function (async, file) {

    async(function () {
 //       ^^^^^^^^ create a cadence of one or more steps.
        fs.readFile(file, 'utf8', async())
                               // ^^^^^^^ create a callback.

    }, function (body) {
              // ^^^^ the result is passed to the next step.

        process.stdout.write(body)

    })
})

cat(__filename, function (error) {
                       // ^^^^^ any error, anywhere inside `cat` is propagated out
    if (error) throw error
})
```

Note that **steps** do not have receive errors. Errors get propagated up and out
to the caller. Your code does not need to be littered with `if (error)
callback(error)` branches that are difficult to reach in your tests. Your
asynchronous code is reduced to the happy path.

## Cadence Basics

Cadence exports a single function which by convention is named `cadence`.

```javascript
var cadence = require('cadence'), fs = require('fs')

var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())

    }, function (list) {

        return list.some(filter)

    })
})

function isJavaScript (file) {
    return /\.js$/.test(file)
}

find(__dirname, isJavaScript, function (error, found) {

    if (error) {
        console.log(error)
    } else if (found) {
        console.log(__dirname + ' contains a JavaScript file.')
    }

})
```

Let's look closer at the `find` function.

```javascript
var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())

    }, function (list) {

        return list.some(filter)

    })

})
```

### Function Body

We create the `find` function by invoking `cadence` with a single argument which
is the function body for `find`.  The `cadence` function will build a function
that, when invoked, will call the function body.

```javascript
var find = cadence(function (async, path, filter) {
                //        ^ function body
    async(function (  {

        fs.readdir(path, async())

    }, function (list) {

        return list.some(filter)

    })

})
```

### The `async` Function

The first argument to the body is the universal builder function which by
convention is named `async`. It is named `async` because anywhere you see it,
you know that something asynchronous is going on.

```javascript
var find = cadence(function (async, path, filter) {
                          // ^^^^^ universal asynchronous builder function.
    async(function () {
 // ^^^^^ it creates both cadences...
        fs.readdir(path, async())
                      // ^^^^^ ...and callbacks
    }, function (list) {

        return [ list.some(filter) ]

    })

})
```

### Steps and Cadences

When you invoke the `async` function with one or more functions, you create a
**cadence**. Each function is a **step** in the cadence.

```javascript
var find = cadence(function (async, path, filter) {

    async(function () { // <- let's create a cadence
       // ^^^^^^^^ step one
        fs.readdir(path, async())

    }, function (list) {
    // ^^^^^^^^ step two
        return [ list.some(filter) ]

    })

})
```

### Cadence Argument Progression

The results of one **step** in a **cadence** become the arguments of the next **step**.

```javascript
var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())
                      // ^^^^^ create a callback whose return value
    }, function (list) {
              // ^^^^ is the argument of the next step
        return [ list.some(filter) ]

    })

})
```

The `async` function is used to create a callback that is given to `fs.readdir`.
The next **step** is called with the result of the previous **step**, but
without the error. The error is shifted off the arguments so that the next
**step** receives no errors, only results. There is no error for the **step** to
check. There is no need for an `if (error)` at every **step**.

### Error Propagation

If an error does occur, it propagates out to the user. No matter how deeply
nested your **cadences**, an error will stop the **cadence** and return the
error to the user.

```javascript
var cadence = require('cadence'), fs = require('fs')

var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())
                      // ^^^^^ an error returned to any callback...
    }, function (list) {

        return [ list.some(filter) ]

    })

})

function isJavaScript (file) {
    return /\.js$/.test(file)
}

find(__dirname, isJavaScript, function (error, found) {
                                     // ^^^^^ ...propagates out to here.
    if (error) {
        console.log(error)
    } else if (found) {
        console.log(__dirname + ' contains a JavaScript file.')
    }

})
```

### Function Body Results

The results of the final **step** in a **cadence** are the results of the
**cadence**.

Notice that if a **step** does not invoke an asynchronous function, it can
simply return a result.

```javascript
var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())

    }, function (list) {

        return [ list.some(filter) ]
     // ^^^^^^ result of final step is the result of the cadence.
    })

})
```

The results of all the **cadences** and **callbacks** in the function body are
the results of the function generated by `cadence`.

```javascript
var cadence = require('cadence'), fs = require('fs')

var find = cadence(function (async, path, filter) {

    async(function () {

        fs.readdir(path, async())

    }, function (list) {

        return [ list.some(filter) ]
     // ^^^^^^ result of the only cadence...
    })

})

function isJavaScript (file) {
    return /\.js$/.test(file)
}

find(__dirname, isJavaScript, function (error, found) {
                                            // ^^^^^ ...is the result of function.
    if (error) {
        console.log(error)
    } else if (found) {
        console.log(__dirname + ' contains a JavaScript file.')
    }

})
```

## Cadence Step by Step

Let's look at the rest of Cadence.

### Our Friend Echo

In our examples we are going to use a function called echo which will invoke the
callback with the argument given. We're also going to assume that we have `ok`
and `equal` to assert what we believe to be true.

```javascript
var ok = require('assert').ok
var equal = require('assert').equal

function echo (value, callback) {
    setImmediate(callback, null, value)
}
```

### Creating Callback Functions

When you invoke `async` with no arguments, it builds a simple error first
**callback** function. Cadence will receive the results given to the
**callback** on your behalf and do the right thing.

```javascript
var calledback = cadence(function (async) {

    echo(1, async())

})

calledback(function (error, value) {

    equal(value, 1, 'called back')

})
```

### Creating Cadences

When you invoke `async` with one or more functions, you build a **cadence**.

```javascript
var stepper = cadence(function (async) {

    async(function () {
       // ^^^^^^^^ one or more functions creates a cadence.
        echo(1, async())

    }, function (value) {

        equal(value, 1, 'stepped')

        echo(value, async())
                 // ^^^^^ this will be the result of the cadence and the function.
    })
})

stepper(function (error, value) {

    equal(value, 1, 'called back')

})
```

### Propagating Errors

Any error or exception that occurs in the function body is propagated to the
caller by default.

```javascript
function brokenEcho (value, callback) {
    callback(new Error('out of service'))
}

var stepper = cadence(function (async) {

    async(function () {

        brokenEcho(1, async())
                   // ^^^^^ this callback will propagate the error.

    }, function (value) { // <- the next step will not be called because of the error.

        brokenEcho(value, async())

    })
})

stepper(function (error, value) {
               // ^^^^^ our error, propagated.
    equal(error.message, 'out of service', 'errors propagate')

})
```

### Propagating Exceptions

Exceptions are also propagated. You can throw an exception anywhere in the
function body and it will propagate out to the user as the error-first error.

```javascript
var stepper = cadence(function (async) {

    async(function () {

        throw new Error('out of service')

    }, function () { // <- will not be called.

        echo(1, async())

    })
})

stepper(function (error, value) {
               // ^^^^^ our exception, propagated.
    equal(error.message, 'out of service', 'exceptions propagate')

})
```

### Function Body Arguments

The first argument to the function body is always the `async` function. The rest
of the arguments are the parameters passed to the `cadence` generated function.

```javascript
var arguable = cadence(function (async, value) {
                                     // ^^^^^ from the caller.
    async(value, async())

})

arguable(1, function (error, value) {
      // ^ `value` parameter in `arguable`.
    equal(value, 1, 'argument passed')

})
```

Because the error-first callback conventions dictate that the error-first `callback` is the
last argument, you might wonder why `async` is the first.

We put the `async` as the first argument, not the last, because Cadence is
nothing without its `async` function. We're (almost) always going to need it so
it will always be passed into the function body as the first argument.

Also a `cadence` generated function always expects a callback. There is
no concept of optional callbacks.

Best of all, putting the `async` function at the head to make it easier to
implement variadic functions. No messy `var callback = vargs.pop()`.

```javascript
var argumentCounter = cadence(function (async) {

    var vargs = Array.prototype.slice.call(arguments, 1)
    step(vargs.length, async())

})

arguable('a', 'b', 'c', function (error, count) {

    equal(count, 3, 'three arguments')

})
```

### Multiple Callback Arguments

Because error-first callbacks can receive multiple arguments, **steps** can
receive multiple arguments and a **cadence** can return multiple results.

Because a **cadence** can return multiple arguments a function body can also
return multiple arguments.

```javascript
function echo2 (one, two, callback) {
    setImmediate(callback, null, one, two)
}

var multi = cadence(function (async)
    async(function () {

        echo2('a', 'b', step())

    }, function (first, second) {

        assert(first, 'a', 'one of two in step')
        assert(second, 'a', 'two of two in step')

        echo2(first, second, step())

    })
})

multi(function (error, first, second) {

    assert(first, 'a', 'one of two results')
    assert(second, 'a', 'two of two results')

})
```

### Synchronous Steps Using `return`

Sometimes **steps** do not need to call asynchronous functions. In that case we can
simply use `return` to pass a value to the next **step**, but only if the value
is not an array.

```javascript
var sync = cadence(function (async) {

    async(function () {

        return 1

    }, function (value) {

        equal(value, 1, 'return number')

        echo(value, step())

    })

})

sync(function (error, value) {

    equal(value, 1, 'sync worked')

})
```

### Returning Multiple Arguments from a Step

When we want to synchronously return multiple values, we return an array of
arguments. The elements in the array are used as the arguments to the next
function, much like calling `apply`.

```javascript
var sync = cadence(function (async) {

    async(function () {

        return [ 1, 2 ]

    }, function (first, second) {

        equal(first, 1, 'one of two')
        equal(second, 2, 'two of two')

        echo(first + second, step())

    })

})

sync(function (error, value) {

    equal(value, 3, 'multiple argument sync worked')

})
```

### Returning an Array from a Step

If you want to synchronously pass an array to the next **step**, you cannot
simply return the array, because the array elements will be used as the
arguments for the next **step**.

To synchronously pass an array to the next step, you return an array of
arguments that contians the array.

```javascript
var sync = cadence(function (async) {

    async(function () {

        var values = [ 1, 2, 3 ]

        return [ values ]

    }, function (values) {

        ok(Array.isArray(values), 'is an array')
        equal(values.length, 3, 'is an array of three elements')

        echo(values.reduce(function (sum, value) { return sum + value }), step())

    })

})

sync(function (error, value) {

    equal(value, 6, 'array as a synchronous worked')

})
```

### Asynchronous Trumps Synchronous

Asynchronous trumps synchronous. If you create a callback or a **cadence** using
`async` inside a **step**, then the return value of the **step** is ignored.

```javascript
var sync = cadence(function (async) {

    async(function () {

        echo(2, async())

        return 1

    }, function (value) {

        equal(value, 2, 'async trumps sync')
        echo(value, step())

    })

})

sync(function (error, value) {

    equal(value, 2, 'async wins')

})
```

### Cadences within Cadences

You can create a **cadence** in a **cadence** and you will. You can create a
**cadence** in any **step**. The result of the **cadence** is passed as an
argument to the next **step**.

A **cadence** is an asynchronous operation that will trump a return values.

```javascript
var sync = cadence(function (async) {

    async(function () {

        async(function () { // <- a cadence in a step.

            echo(1, async())

        }, function (value) {

            echo(value + 1, async())
                         // ^^^^^ last callback of last step.
        })

    }, function (value) {

        equal(value, 2, 'sub-cadence output')
        echo(value, step())

    })

})

sync(function (error, value) {

    equal(value, 2, 'cadences within cadences')

})
```

Return values from **cadences** propagate up. Nest them as you see fit.

```javascript
var sync = cadence(function (async) {

    async(function () {

        async(function () {

            echo(1, async())

        }, function (value) {

            async(function () { // <- one step cadence, three cadences deep.

                echo(value + 1, async())
                             // ^^^^^ this result goes up two cadences.
            })

        })

    }, function (value) {

        equal(value, 2, 'sub-cadence output')
        echo(value, step())

    })

})

sync(function (error, value) {

    equal(value, 2, 'cadences within cadences')

})
```

### Cadences within Cadences: Practical Application

You will use **cadences** in **steps** in **cadences** to manage your scope. It
is a common construct.

In Cadence an indent means something. It means a new scope. You stay indented
when you have variables that need to be in scope for multiple asynchronous
operations. When the variables are no longer needed, the indent ends.

The following looks for the Unix execuable [magic
number](http://en.wikipedia.org/wiki/Shebang_%28Unix%29#Magic_number). *TK:
Create optional captions for code examples.*

```javascript
#!/usr/bin/env node

// `sip`: sip the first `count` bytes of a file.
var sip = cadence(function (async, file, count) {

    async(function () {

        fs.open(file, step())

    }, function (fd) {
              // ^^ we need to use this for more than one step.
        async(function () {

            var buffer = new Buffer(count)
            fs.read(buffer, 0, buffer.length, 0, step())

        }, function (bytesRead, buffer) {
                  // ^^^^^^^^^  ^^^^^^  must close the file descriptor  before we can return these.
            async(function () {

                fs.close(fd, step())

            }, function () {

                return buffer.slice(0, bytesRead) // <- we're three cadences deep

            })

        })

    })

})

// sip two bytes of a file and look for the executable magic number.
sip(__filename, 2, function (error, value) {

    if (value.length == 2 && value[0] == 0x23 && value[1] == 0x21) {
        console.log('I have a shebang line!')
    }

})
```

### Fallthrough when a Step Returns Nothing

If you create a **step** that neither returns a value nor creates an
asynchronous operation using the `async` function, then the results of that
**step** are its arguments.

Put another way, if a **step** does not produce any results, then the **next**
step receives the results of the last **step** to produce results.

```javascript
var fallthrough = cadence(function (async) {

    async(function () {

        echo(1, async())

    }, function (value) {

        equal(value, 1, 'callback value')

        console.log(value)

    }, function (value) {

        equal(value, 1, 'callback value from step before last')

        return value + 1

    }, function (value) {

        equal(value, 2, 'returned value')

        console.log(value)

    }, function (value) {

        equal(value, 2, 'returned value from step before last')
                // <- no return or `async`, outcome is also a fall through.
    })

})

fallthrough(function (error, value) {

    equal(value, 2, 'fell through')

})

```

### Parallel versus Serial

The **steps** in a **cadence** run in *serial*, one step after another.

The asynchronous operations in a **step** run in *parallel*. An asynchronous
operation in a **step** is a **cadence** or a function that invokes a
**callback**.

If you see `async` in a **step**, something asynchronous is going on. If you see
more than one `async` in a **step**, something parallel is going on.

Multiple the results of multiple asynchronous operations in a **step** are
gathered and passed as arguments to the next **step**. The next **step** is not
called until all the asynchronous operations finish.

```javascript
var parallel = cadence(functions (async) {

    async(function () {

        echo(1, async())            // <- first async call.
        echo(2, async())            // <- second async call.

    }, function (first, second) {   // <- called when both echoes complete.

        return [ first, second ]

    })
})

parallel(function (error, first, second) {

    assert(first, 1, 'one of two returned')
    assert(second, 1, 'two of two returned')

})
```

The next **step** is called with the results of the mulitple **callbacks** or
**cadences**. The results are returned in the order in which their **callback**
or **cadence** was declared.

```javascript
var parallel = cadence(functions (async) {

    async(function () {

        var first = async()         // <- first callback.
        var second = async()        // <- second callback.

        second(null, 1)             // <- call second first, and right now.
        echo(1, first)              // <- call first on next tick.

    }, function (first, second) {

        assert(first, 1, 'first order of callback do not matter')
        assert(second, 2, 'second order of callback do not matter')

        return [ first, second ]

    })
})

parallel(function (error, first, second) {

    assert(first, 1, 'one of two returned')
    assert(second, 1, 'two of two returned')

})
```

Parallel loops can be found below. That is the model for a bunch of identical
asynchronous operations running in parallel, or *homogeneous* parallel
operations. There you will see `async` but once, yet something parallel is going
on, so the above is a aphorism, not a hard rule.

*TK: This might be moved to a usage section. The example can stay. The statement
above, plus the example. Anyway, on to arity.*

Although there are mechanisms for homogeneous parallel operations, that sort of
parallelism is best obtained at the serivce level. Instead of having a
highly-parallel directory listing in your web server, let your web server serve
many directory listings in parallel, each being worked through in serial. You
will get similar performance, but with a lot less complexity.

The complexity comes in the error handling. If you can't read one file in a
directory, you probably can't read any of them. Now you have an array of errors
instead of an array of file statistics.

What we are discussing here are *heterogeneous* parallel operations, and they are
generally useful and easy to reason about. The make a lot of sense when you
need to to create funnel, performing multiple heterogeneous asynchronous
operations needed for the next **step**.

The following is a contrived initialization example.

```javascript
var initialize = cadence(function (step, conf) {

    step(function () {

        db.connect(step())                      // <- connect to database.
        fs.readFile(conf, 'utf8', step())       // <- *and* slurp configuration.

    }, function (conn, conf) {                  // <- initialize the connection
                                                //       with the configuration.
        conf = JSON.parse(conf)

        conn.encoding = conf.encoding || 'UTF-8'
        conn.lang = conf.lang || 'en_US'

        return conn

    })
})
```

### Breaking, Leaving a Cadence Early

Most control flow will be done with loops, but the `async` function has a
`async.break` label and a `async.continue` label that you can use for a
control-flow shortcut.

You can leave a **cadence** by returning an array of arguments, the first
argument being the value of `async.break`, it is a break label.

The mnemonic is that the first argument is an optional break, and `async` is
what you're breaking out of.

```javascript
var early = cadence(function (async) {
    async(function () {

        return [ async.break, 2 ]   // <- break

    }, function () {

        echo(1, value())            // <- never called

    })
})

early(function (error, result) {
    assert(result, 2, 'broke early')
})
```

TK Write a document on `async.loop` as a proposal.

Now that I document it, `async.continue` feels silly, so I'm going to have to
consider whether it makes sense with loop label breaks.

You will use this construct all the time to end loops. You will also use it to
return early when you catch an exception.

The following is example of returing cached asynchronous operation early.

I've said that asynchronous trumps synchronous, but `return` trumps anything
that follows it. That is why `return` makes for a nice break construct.

```javascript
var fs = require('fs'), cadence = require('cadence'), config

module.exports = cadence(function (async) {

    async(function () {

        if (config) return [ async, config ]

        fs.readFile('./config.json', 'utf8', step())

    }, function (body) {

        return [ config = JSON.parse(body) ]

    })

})
```

### Forever Loops

A loops is a **cadence** that repeats itself. When we create a **cadence**, the
`async` function returns a loop function that we can use to invoke the
**cadence** as a loop.

By convention, we call this loop function immediately.

This is an endless loop. In order to leave the loop we need to break from the
**cadence**.

```javascript
var loopy = cadence(function (async) {

    var count = 0

    var loop = async(function () {

        if (count == 10) {
            return [ loop.break, count ]   // <- break and return count.
        } else {
            count++
        }

    })()
   // ^^ loop forever.
})

loopy(function (error, value) {

    assert(value, 10, 'looped')

})
```

### Counted Loops


We can specify a count for a loop by passing a count to the loop starter
function. The count must be an integer greater than or equal to zero. The loop
will run count times.


```javascript
var counted = cadence(function (async) {

    var count = 0

    async(function () {

        async(function () {

            count++

        })(4)
        // ^ the above cadence is run four times.
    }, function () { // <- not called until loop in previous step finishes.

        return count

    })

})

counted(function (error, value) {

    assert(value, 4, 'counted')

})
```

### Counted Loop Result

The result of a counted loop is the value returned by the last loop iteration,
which is also the last run of the **cadence**.


```javascript
var counted = cadence(function (async) {

    var count = 0

    async(function () {

        return ++count
              // ^^^^^ returned as loop result on last run of the cadence.
    })(4)
    // ^ the above cadence is run four times.
})

counted(function (error, value) {

    assert(value, 4, 'counted')

})
```

### The Counted Loop Index Argument

The first argument to the **cadence** of a counted loop is the always index of
the current count.


```javascript
var counted = cadence(function (async) {

    async(function (index) {

        return index + 1
            // ^^^^^ on the last run of the cadence, index is three.
    })(4)
    // ^ the above cadence is run four times.
})

counted(function (error, value) {

    assert(value, 4, 'counted')

})
```

### Counted Loop Additional Arguments

While the first argument to the counted loop **cadence** is the always index of
the current count, you can pass additional arguments into the loop **cadence**
by specifying them after the count.

The arguments after the index argument are the arguments passed to the loop
starter on the first iteration.

On subsequent iterations the arguments after the index argument are the results
of the previous iteration, the previous invocation of the **cadence**.

```javascript
var reduce = cadence(function (async) {

    async(function (index, sum) {
                        // ^^^ initial argument or result of last iteration.
        return index + 1 + sum

    })(4, 0)
       // ^ initial argument.
})

reduce(function (error, value) {

    assert(value, 10, 'reduced sum')

})
```

### Each Loops

When you pass an array as the first argument to the loop starter function, you
create an each loop. An each loop will run the loop **cadence** once for each
entry in the array. The array entry is passed into the first **step** of the
**cadence** as the first argument.

```javascript
var sum = cadence(function (async) {

    var sum = 0

    async(function (number) {
                 // ^^^^^^ one array element at a time.
        return sum + number

    })([ 1, 2, 3 ])
    // ^^^^^^^^^^^ array argument to loop function.
})

sum(function (error, value) {

    assert(value, 10, 'summed')

})
```

### Each Loop Index Argument

The second argument to an each loop **cadence** is the index of the entry in the
array.

```javascript
var sum = cadence(function (async) {

    var sum = 0

    async(function (number, index) {
                         // ^^^^^ index of array entry.
        return sum + (number - index)

    })([ 1, 2, 3 ])

})

sum(function (error, value) {

    assert(value, 3, 'sum of ones')

})
```

### Each Loop Additional Arguments

You can pass arguments to the each loop **cadence** by passing them in after the
each loop array.

The arguments after the array argument are the arguments passed to the loop
starter on the first iteration.

On subsequent iterations the arguments after the index argument are the results
of the previous iteration, the previous invocation of the **cadence**.

```javascript
var reduce = cadence(function (async) {

    async(function (number, index, sum) {
                                // ^^^ initial argument or result of last iteration.
        return sum + number

    })([ 1, 2, 3 ], 0)
                 // ^ initial argument.
})

reduce(function (error, value) {

    assert(value, 10, 'reduced sum')

})
```

### Forever Loop Arguments

If you want to parse arguments into your loop **cadence** but you do not want a
counted loop nor an each loop, then you create a forever loop by creating a
counted loop with an unreachable count such as `-1`.

```javascript
var until = cadence(function (async) {

    var count = 0

    async(function (index, done) {

        if (done) [ async, count ]

        return ++count == 10

    })(-1, false)
    // ^^  ^^^^^ unreachable count and initial argument.
})

until(function (error, value) {

    assert(value, 10, 'reduced sum')

})
```

### Gathered Loops

Loops can gather their results into an array. To specify that a loop should
gather results, pass an array as the first argument to the loop starter. You can
use an array literal. This array is only used to signal that results should be
gathered, it is not the array used to gather results.

```javascript
var squares = cadence(function (async) {

    async(function (index) {

        return index * index

    })([], 3)
    // ^^  ^ gather a counted loop.
})

squares(function (error, array) {

    assert(array[0], 0, 'first gathered value')
    assert(array[1], 1, 'second gathered value')
    assert(array[2], 4, 'thrid gathered value')

})
```

### Loops Nested in Cadences

All of the above loop examples can be used in any **step** in any **cadence**.

## Here Be Dragons

After this point is old documentation. I'm pulling anything useful up above this
heading. Anything you read below is goofy and dubious.

Cadence might be as verbose as something you might write yourself, in fact is
might be more verbose, but while you'll have more characters, you'll have fewer
conditions. I'm not trying to save characters. I'm not trying to save
keystrokes. I'm trying to save work. I'm trying to save cognition.


## Recursion

Cadence creates an error-first asynchronous function. If you need to perform a
recursive operation in Cadence, then call the function generated by `cadence`.

## Reuse

By convention steps are *anonymous* functions. We do not create **step**
functions that we reuse. If we want to reuse a **step** or a series of
**steps**, we simply create a new function using `cadence` and call that
function the way we would any other error-first asynchronous function.

### Cadences Within Steps Within Cadences

You can define a cadence within a step. This let's you work with results of an
asynchronous call.

Let's say that we want to get a `stat` object, but include the body of the file
in the `stat` object. When we get our `stat` object, we can use a sub-cadence to
complete the `stat` object by reading the body.

```javascript
var cadence = require('cadence'), fs = require('fs')

module.exports = cadence(function (step, file) {
    step(function () {
        fs.stat(file, step())
    }, function (stat) {
        step(function () {    // sub-cadence
            fs.readFile(file, 'utf8', step())
        }, function (body) {
            stat.body = body
            return stat;
        })
    })
})

```

This happens quite often actually. Sometimes you've already invoked the
asynchronous function and have a copy of the result. Other times you want to do
some synchronous processing of the result of an asynchronous call. The example
below illustrates both cases.

Returning an array is a special case. When you return an array the elements of
the array are used as the arguments to the subsequent function.

```javascript
cadence(function () {
    step(function () {
        return [ 1, 2, 3 ]
    }, function (one, two, three) {
        equal(one, 1, 'returned one')
        equal(two, 2, 'returned two')
        equal(three, 3, 'returned three')
    })
})
```

What if you want to return an array as the sole argument to the subsequent
function? Then put the array in an array as the sole element.

```javascript
cadence(function () {
    step(function () {
        return [ [ 1, 2, 3 ] ]
    }, function (array) {
        equal(array[0], 1, 'element one')
        equal(array[1], 2, 'element two')
        equal(array[2], 3, 'element three')
    })
})
```

We're going to use this construct in a bit to break out of loops

### Catching Errors

Cadence encourages parallelism, and because parallel operations can also
fail in parallel and/or raise many exceptions in parallel (fun stuff),
its internal error handling mechanism deals with arrays of errors.

Externally, however, your caller is expecting one single error, because Cadence
builds a function that follows the error-first callback standard. Thus, even
when there are many errors, the default is to return the first error that occurs
in the cadence.

When an error occurs, Cadence waits for all parallel operations to complete,
then it raises the error along with any other errors that occured in parallel.
If you want to catch these errors, create a try/catch function pair by wrapping
it in an array.

```javascript
cadence(function () {
    step([function () {

        // Do something stupid.
        fs.readFile('/etc/shadow', step())

    }, function (errors) {

        // Catch the exception.
        ok(errors[0].code == 'EACCES', 'caught EACCES')
        ok(errors.length == 1, 'caught EACCES and only EACCES')

    }])
})()
```

In the above, we catch the `EACCES` that is raised when we attempt to read a
read-protected file. Note the array that binds the catch function to the step
that proceeds it.

If no error occurs, the catch function is not invoked. The next function in the
cadence after the try/catch pair is invoked with the successful result of the
try function.

```javascript
cadence(function () {
    step([function () {

        // Read a readable file.
        fs.readFile('/etc/hosts', 'utf8', step())

    }, function (errors) {

        // This will not be called.
        proecss.stderr.write('Hosts file is missing!\n')

    }], function (hosts) {

        process.stdout.write(hosts)

    })
})()
```

When an error triggers the catch function, the catch function can recover and
continue the cadence by returning normally.

```javascript
cadence(function () {
    step([function () {

        // Read file that might be missing.
        fs.readFile(env.HOME + '/.config', 'utf8', step())

    }, function (errors) {

        // That didn't work, for whatever reason, so try the global.
        fs.readFile('/etc/config', 'utf8', step())

    }], function (config) {

        process.stdout.write(config)

    })
})()
```

Also note that both the try function and error function can use sub-cadences,
arrayed cadences, fixups, etc.; everything that Cadence has to offer.

A catch function also catches thrown exceptions.

```javascript
cadence(function () {
    step([function () {

        throw new Error('thrown')

    }, function (errors) {

        ok(errors[0].message == 'thrown', 'caught thrown')
        ok(errors.length == 1, 'caught thrown and only thrown')

    }])
})()
```

Errors are provided in an `errors` array. Why an array, again? Because with Cadence,
you're encouraged to do stupid things in parallel.

```javascript
cadence(function () {
    step([function () {

        // Read two read-protected files.
        fs.readFile('/etc/shadow', step())
        fs.readFile('/etc/sudoers', step())

    }, function (errors) {

        ok(errors[0].code == 'EACCES', 'caught EACCES')
        ok(errors[1].code == 'EACCES', 'caught another EACCES')
        ok(errors.length == 2, 'caught two EACCES')

    }])
})()
```

Note that the errors are indexed in the **order in which they were caught**,
not in the order in which their callbacks were declared.

The second argument to a function callback is the first error in the errors
array. This is in case you're certain that you'll only ever get a single error,
and the array subscript into the `errors` array displeases you.

```javascript
cadence(function () {
    step([function () {

        fs.readFile('/etc/shadow', step())

    }, function (errors, error) {

        ok(error.code == 'EACCES', 'caught EACCES')

    }])
})()
```

For the sake of style, when you don't want to reference the errors array, you
can of course hide it using `` _ `` or, if that is already in use, double `` __ ``.

```javascript
cadence(function () {
    step([function () {

        fs.readFile('/etc/shadow', step())

    }, function (_, error) {

        ok(error.code == 'EACCES', 'caught EACCES')

    }])
})()
```

### Propagating Errors

You can propagate all of the caught errors by throwing the `errors` array.

Imagine a system where sudo is not installed (as is the case with a base
FreeBSD.)

```javascript
cadence(function () {
    step([function () {

        // Read two read-protected files.
        fs.readFile('/etc/sudoers', step())
        fs.readFile('/etc/shadow', step())

    }, function (errors) {

        // Maybe sudo isn't installed and we got `ENOENT`?
        if (!errors.every(function (error) { return error.code == 'EACCES' })) {
            throw errors
        }

    }])
})(function (error) {

    // Only the first exception raised is reported to the caller.
    if (error) console.log(error)

})
```

You can also just throw an exception of your chosing.

```javascript
cadence(function () {
    step([function () {

        // Read two read-protected files.
        fs.readFile('/etc/sudoers', step())
        fs.readFile('/etc/shadow', step())

    }, function (errors) {

        // Maybe sudo isn't installed and we got `ENOENT`?
        if (!errors.every(function (error) { return error.code == 'EACCES' })) {
            throw new Error('something bad happened')
        }

    }])
})(function (error) {

    ok(error.message, 'something bad happened')

})
```

When you raise an error in a catch function, it cannot be caught in the current
cadence. You can still catch it in a calling cadence, however.

Here we log any errors before raising them all up to the default handler:

```javascript
cadence(function () {
    step([function () {
        step([function () {

            // Read two read-protected files.
            fs.readFile('/etc/sudoers', step())
            fs.readFile('/etc/shadow', step())

        }, function (errors) {

            // Maybe sudo isn't installed and we got `ENOENT`?
            if (!errors.every(function (error) { return error.code == 'EACCES' })) {
                throw errors
            }

        }])
  }, function (errors) {

      errors.forEach(function () { console.log(error) })
      throw errors

  }])
})(function (error) {

    ok(error, 'got a single error')

})
```

As you can see, Cadence will catch exceptions as well as handle errors passed to
callbacks.

### Conditional Error Handling

Dealing with an array of errors means you're almost always going to want to
filter the array to see if it contains the error you're expecting, and which error
that might be. Because this is so common, it's built into Cadence.

To create a try/catch pair that will respond only to certain errors, add a
regular expression between the try function and the catch function.

```javascript
cadence(function () {
    step([function () {

        // Read file that might be missing.
        fs.readFile(env.HOME + '/.config', 'utf8', step())

    }, /^ENOENT$/, function () {

        // That didn't work because the file does not exist, try the global.
        fs.readFile('/etc/config', 'utf8', step())

    }], function (config) {

        process.stdout.write(config)

    })
})()
```

In the above example, we only catch an exception if the `code` property matches
/ENOENT/. If there is a different error- say, the file exists but we can't
read it- that error is not caught by our try/catch pair.

The condition is tested against the `code` property if it exists. If it doesn't
exist then it is tested against the `message` property.

You can easily test for multiple error codes using a regular expression, as
well. Here we test for both `EACCES` and `ENOENT`.

```javascript
cadence(function () {
    step([function () {

        fs.readFile('/etc/sudoers', step())
        fs.readFile('/etc/shadow', step())

    }, /^(EACCES|ENOENT)$/, function (errors) {

        ok(errors.length == 2, 'handled')

    }])
})()
```

You can also be explicit about the property used to test by adding the name of
that property between the try function and the condition. Here we explicitly
state that the `code` property is the property to test.

```javascript
cadence(function () {
    step([function () {

        fs.readFile('/etc/sudoers', step())
        fs.readFile('/etc/shadow', step())

    }, 'code', /^(EACCES|ENOENT)$/, function (errors) {

        ok(errors.length == 2, 'handled')

    }])
})()
```

If the condition does not match all the examples raised, then the catch function
is not invoked, and the errors are propagated.

However, if the errors are not caught and propagated out of Cadence and to the
caller, then the caller will receive the first exception that did not match the
conditional.

```javascript
cadence(function () {
    step([function () {

        step()(null,
        fs.readFile('/etc/sudoers', step())
        fs.readFile('/etc/shadow', step())

    }, /^(EACCES|ENOENT)$/, function (errors) {

        ok(errors.length == 2, 'handled')

    }])
})()
```

Why? Because we can only return one exception to the caller, so it is better to
return the unexpected exception that caused the condition to fail, even if it
was not the first exception raised by the Cadence. It makes it clear that the
condition is failing because of additional errors.

TK: Throwing errors resets the concept of unmatched.

#### Error Catching Example

Let's extend our `deleteIf` function. Let's say that if the file doesn't exist,
we ignore the error raised when we stat the file. To catch the error we wrap our
call to `stat` in a try/catch function pair. If the call to `stat` results in
`ENOENT`, our catch function is called. The catch function simply returns early
because ther is no file to delete.

```javascript
// Use Cadence.
var cadence = require('cadence'), fs = require('fs')

// Delete a file if it exists and the condition is true.
var deleteIf = cadence(function (step, file, condition) {
    step([function () {

        fs.stat(file, step())

    }, /^ENOENT$/, function (error) {

        // TK: Early return example can be if it is a directory, return early.
        step(null)

    }], function (stat) {

      if (stat && condition(stat)) fs.unlink(step())

    })
})

// Test to see if a file is empty.
function empty (stat) { return stat.size == 0 }

// Delete a file if it exists and is empty.
deleteIf(__filename, empty, function (error) { if (error) throw error })
```

We test to see if the error is `ENOENT`. If not, we have a real problem, so we
throw the error. The throw is caught and forwarded to the callback that invoked
the cadence function.

If the error is `ENOENT`, we exit early by calling the step function directly as
a if it were itself an error/result callback, passing `null` to indicate no
error.

## Working with Events

Going to rewrite this for Delta, but then it needs to move to Delta.

So, use Delta.

```javascript
var cadence = require('cadence'), event = require('event')
  , ee = new event.EventEmitter()

cadence(function (async, ee) {
    async(function () {
        delta(async()).ee(ee).on('data', []).on('end')
    }, function (data) {
        assert.deepEqual(data, [ 1, 2, 3 ])
    })
})(emitter)

ee.emit('data', 1)
ee.emit('data', 2)
ee.emit('data', 3)

ee.emit('end')
```

Here's a `mkdirp`, but let's complete it.

```javascript
var mkdirs = cadence(function (step, directory) {
    directory = path.resolve(directory)
    var mode = 0777 & (~process.umask())
    var made = null

    async([function () {
        fs.mkdir(directory, mode, async())
    }, function (error) {
        if (error.code == 'ENOENT') {
            async(function () {
                mkdirp(path.dirname(directory), async())
            }, function () {
                return [ async.continue ]
            })
        } else {
            async(function () {
                fs.stat(directory, async())
            }, function (stat) {
                if (!stat.isDirectory()) {
                    throw new Error('not a directory')
                }
            })
        }
    }])
})
```

## Loops

TK: Serial and parallel loops, but parallel doesn't really loop.

### Serial Loops

TK: So, just Loops, then? What about Serial Each and Parallel Each?
TK: Do examples look better without commas?

Cadence wants you to use nesting to represent subordinate operations, so it wants
to provide you with a looping structure that is not terribily compilicated, or
nested.

Looping in Cadence is performed by defining a sub-cadence, then invoking the
function that is returned by the sub-cadence definition. We'll call this the
**looper function**. If you **do not invoke** the function, Cadence will start
the sub-cadence for you when your step returns and run the sub-cadence once. If
you **do invoke** the function, Cadence will run the sub-cadence as a loop.

You can create `while` loops, `do...while` loops, stepped loops and `forEach`
loops using the looper function.

### Endless Loops

If you invoke without arguments, you will invoke an endless loop. You terminate
the loop using the `step(error, result)` explicit return.

Calling `looper()`.

```javascript
cadence(function (step) {
    var count = 0
    step(function () {
        count++
    }, function () {
        if (count == 10) step(null, count)
    })() //immediate invocation
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'loop')
})()
```

When your terminal condition is the last function, you've basically created a
`do...while` loop.

### Loop Initializers

When an endless loop iterates, the result of the last function is passed as
arguments to the first function. You can use this to create a `while` loop.

To pass in an initial test value to the endless loop, you invoke the looper
function with a leading `null`, followed by the parameters, `looper(null, arg1,
arg2)` the same the way you invoke an explicit return of the `step` function.

Calling `looper(null, arg)`.

```javascript
cadence(function (step) {
    var count = 0
    step(function (more) {
          if (!more) step(null, count)
    }, function () {
          step()(null, ++count < 10)
    })(null, true)
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'initialized loop')
})
```

### Counted Loops

You can tell Cadence to loop for a fixed number of times by invoking the loop
start function with a count of iterations.

```javascript
cadence(function (step) {
    var count = 0
    step(function (count) {
        equal(count, index, 'keeping a count for you')
        step()(null, ++count)
    })(10)
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'counted loop')
})
```

### Each Loops

You can invoke the loop passing it an array. The loop will be invoked once for
each element in the array, passing the array element to the first function of
the sub-cadence.

```javascript
cadence(function (step) {
    var sum = 0
    step(function (number, index) {
        equal(index, number - 1, 'keeping an index for you')
        step()(null, sum = sum + number)
    })([ 1, 2, 3, 4 ])
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'reduced each loop')
})
```

### Gathered Loops

Both counted loops and each loops can be gathered into an array. If you pass an
initial array to the callback function, then each iteration will be gathered
into an array result.

```javascript
cadence(function (step) {
    var count = 0
    step(function () {
        step()(null, ++count)
    })([], [ 1, 2, 3, 4 ])
})(function (error, result) {
    if (error) throw error
    deepEqual(result, [ 1, 3, 6, 10 ], 'gathered each loop')
})
```

You cannot gather endless loops.

### Loop Labels

If you want to give up early and try again, you can use a loop label. When you
invoke the looper function it returns a label object. You can use the label
object to restart the loop.

```javascript
cadence(function (step) {
    var count = 0
    var retry = step([function () {
        if (++count != 10) throw new Error
        else step(null, 10)
    }, function () {
        step(retry)
    }])(1)
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'loop continue')
})
```

This one's tricky. Because we specified a count of `1`, the loop will only loop
once, but because we call the `retry` label when we catch an error, the loop
tries again.

### Loop Label Quick Returns

Some of the things we document here are about style and syntax bashing that you
can do. It's not necessarily a part of Cadence.

Often times when working with labels, you're testing to see if you should invoke
the label when you enter a function; if not you would like to do something else.
This is going to create an `if/else` block that increases our nesting. If we
were programming synchronously in plain old JavaScript, we could call `continue`
and that would jump to the loop label.

To preserve that jumpy feeling, when you invoke `step(label)` it returns true,
so you can create a return using `&&`.

```javascript
cadence(function (step) {
    var retry = step([function (count) {
        if (count != 10) throw new Error('retry')
        else step(null, 10)
    }, function (_, error) {
        if (error.message == 'retry') return step(retry) && count + 1
        throw error
    }])(1, 0)
})(function (error, result) {
    if (error) throw error
    equal(result, 10, 'loop continue')
})
```

TK: Another example of this...

```javascript
if (count != stop) return step(retry) && return count + 1
```

## Control Flow

Here is where you would discuss `step.jump` and the function index.
