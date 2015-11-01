Cadence is a control-flow library for error-first callback style of asynchronous
programming.

Cadence is my solution to the problem of the [Pyramid of
Doom](http://tritarget.org/blog/2012/11/28/the-pyramid-of-doom-a-javascript-style-trap/).

Cadence is one step after another, with robust try/catch error handling for
asynchronous errors, finalizers for clean up, nested asynchronous loops with
break and continue, and tail-recursion elimination to you'll never blow your
stack looping.

Cadence does all this in pure-Javascript with no transpilers and without ES6+
features. Cadence is classic Javascript. Cadence is tiny. Cadence is fast.

### Cadence In a Nutshell

Cadence runs a series of functions asynchronously, using the results of one
function as the arguments for the next.

We call the series of functions a **cadence**. We call an individual function in
a cadence a **step**.

We create **cadences** using the universal builder method `async`. We also use
`async` to create **callbacks** inside the **steps**. The `async` function is a
universal builder because we also use it to create both **cadences** and
**calbacks**.

```javascript
// `cat`: write a file to a stream.
var cat = cadence(function (async, file, stream) {
                         // ^^^^^ our universal builder function.
    async(function () {
 //       ^^^^^^^^ create a cadence of one or more steps.
        fs.readFile(file, 'utf8', async())
                               // ^^^^^^^ create a callback.

    }, function (body) {
              // ^^^^ the result is passed to the next step.
        stream.write(body)

    })
})

cat(__filename, process.stdout, function (error) {
                                       // ^^^^^ any error, anywhere inside `cat` is propagated out
    if (error) throw error
})
```

Note that **steps** do not receive errors. Errors get propagated up and out to
the caller. Your code does not need to be littered with `if (error)
callback(error)` branches that are difficult to reach in your tests. **Your
asynchronous code is reduced to the happy path.**

Here an example of a function that will return true if a regex matches the
contents of a file.

```javascript
var cadence = require('cadence'), fs = require('fs')

var grep = cadence(function (async, file) {

    async(function () {

        fs.readFile(file, 'utf8', async())

    }, function (body) {

        return [ regex.test(body) ]

    })

})

grep(__filename, /readFile/, function (error, deleted) {
    if (error) console.log(error)
    else if (found) console.log('found readFile')
    else console.log('did not find readFile')
})
```

The example above shows a basic Cadence function. The first argument to the
Cadence function body is `async`, a helper function that creates **cadences**
and **callbacks**. The function above has a single **cadence** defined by
calling `async` with a series of functions.

The functions are the **steps** in the **cadence**. The results of one **step**
are passed onto the next **step**. (This was inspired by Tim Caswell's
[step](https://github.com/creationix/step) module.)

When a **step** calls an asynchronous function, it creates a callback using
`async()`. The results of the callback are passed onto the next **step**.

Any error encountered in any step is propagated up and out of the Cadence
function and becomes the `error` result given to the callback provided to the
Cadence function.

### Major Benefit: Try/Catch and Finalize

Cadence implements an asynchronous try/catch block that propagates error-first
callback errors and converts thrown exceptions into error-first callback errors.
When uses consistently, you end up having an asynchronous call stack.

```javascript
var cadence = require('cadence'), fs = require('fs')

var deleteIf = cadence(function (async, file) {

    async([function () {

        fs.unlink(file, async())        // try

    }, /^ENOENT$/, function () {

        return [ async.break, false ]   // catch ENOENT

    }], function () {

        return [ true ]                 // deleted

    })

})

deleteIf('junk.txt', function (error, deleted) {
    if (error) console.log(error)
    console.log('junk.txt: was deleted ' + deleted)
})
```

In the above we use a catch block to catch an `ENOENT` error and return `false`,
otherwise return `true`. If an error other than `ENOENT` is raised, the the
error will be passed as the first argument. The try/catch block is the try
**step** and the catch **step** paired together in an array. You can see how we
can return `async.break` from any **step** to leave the **cadence** early.

Until you use it, it is hard desrcibe how much easier it is to program
asynchronous Node.js when you have this asynchronous stack. You're no longer
dealing with mystery errors merging from a univeral error handler, your error
handing can have context; you know the nature of the error, because you know the
function you called that raised the error.

### What Cadence Can Do for You

*Ed: Older benefit list, all still true, but needs tidy.*

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
   Cadence handles your errors for you and propagates them up and out to the
   user.
 * What about cleaning up after an error? You can't just `if (error)
   callback(error)` if you have files open or databases on the line. Cadence has
   try/catch blocks and finalizers.
 * Who is `this`? With Cadence `this` is consistent all throughout a function
   body. You don't have to `bind(this)` or `var self = this` with Cadence.

You can use Cadence in the browser too. It is not Node.js dependent and it
minzips to ~2.31k. Great for use with Browserfy.

## Cadence Step by Step

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

To learn more about Cadence, let's look closer at the `find` function.

### Function Body

We create the `find` function by invoking `cadence` with a single argument which
is the function body for `find`.  The `cadence` function will build a function
that, when invoked, will call the function body.

```javascript
var find = cadence(function (async, path, filter) {
                // ^^^^^^^^ function body
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

    }, function (value) { // &lt;- the next step will not be called because of the error.

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

    }, function () { // &lt;- will not be called.

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

        async(function () { // &lt;- a cadence in a step.

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

            async(function () { // &lt;- one step cadence, three cadences deep.

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

                return buffer.slice(0, bytesRead) // &lt;- we're three cadences deep

            })

        })

    })

})

// sip two bytes of a file and look for the executable magic number.
sip(__filename, 2, function (error, value) {

    if (value.length == 2 &amp;&amp; value[0] == 0x23 &amp;&amp; value[1] == 0x21) {
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
                // &lt;- no return or `async`, outcome is also a fall through.
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

        echo(1, async())            // &lt;- first async call.
        echo(2, async())            // &lt;- second async call.

    }, function (first, second) {   // &lt;- called when both echoes complete.

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

        var first = async()         // &lt;- first callback.
        var second = async()        // &lt;- second callback.

        second(null, 1)             // &lt;- call second first, and right now.
        echo(1, first)              // &lt;- call first on next tick.

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

        db.connect(step())                      // &lt;- connect to database.
        fs.readFile(conf, 'utf8', step())       // &lt;- *and* slurp configuration.

    }, function (conn, conf) {                  // &lt;- initialize the connection
                                                //       with the configuration.
        conf = JSON.parse(conf)

        conn.encoding = conf.encoding || 'UTF-8'
        conn.lang = conf.lang || 'en_US'

        return conn

    })
})
```

### Breaking, Leaving a Cadence Early

**TODO**: This is gone, but maybe I'll have it back if it is super cheap.

You can leave a **cadence** by returning an array of arguments, the first
argument being the `async` function.

The mnemonic is that the first argument is an optional break, and `async` is
what you're breaking out of.

```javascript
var early = cadence(function (async) {
    async(function () {

        return [ async, 2 ]         // &lt;- the `async` means break.

    }, function () {

        echo(1, value())            // &lt;- never called.

    })
})
```

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

    async(function () {

        if (count == 10) {
            return [ async, count ]     // &lt;- break and return count.
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
    }, function () { // &lt;- not called until loop in previous step finishes.

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
