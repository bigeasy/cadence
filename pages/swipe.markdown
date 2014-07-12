Cadence is a small JavaScript library (well, function) that enables defining
flow/control structures using callbacks. By providing a series of callback
functions, you can have your functions executed in absolute order with the
return values of the previous respective functions. This is useful when the
callback syntax of JavaScript combined with various looping structures
obfuscates code; Cadence abstracts away your looping construct and allows you to
declare and/or call each function inline, without messy indents from various
callbacks. Thus, the layout of your code much more clearly reflects the flow of
your program.

Besides using multiple top-level cadences, Cadence is flexible enough to allow
you to nest so-called "sub-cadences" in such a way that allows you to avoid ugly
callback-within-a-callback-within-another-callback structures.. within your
callback. This is useful because it allows you to write complex asynchronous
code without the ugly aesthetics usually involved. Also, keep in mind that while
your parent or 'outer' cadence is dependent on your sub-cadences to move
forward, sub-cadences are not dependent on each other; this means that Cadence
can - and will - run your sub-cadences in parallel.

While Cadence gets rid of your loop declarations and syntax, it does not
*restrict* your looping constructs in any way - writing a map or reduce still
works the same, and you can still specify how long a cadence should loop for if
you want. You can instruct Cadence to build an array of all of your return
values, and if you do not then Cadence will give you back the value of the very
last run of that loop. Cadence can also infer the arity of the functions you
provide it, but it is possible to explicitly inform Cadence to pass a specific
number of arguments along. There are other aspects of Cadence to round it out
and provide various utilities, like specifying "finalizer" functions, labeling
functions for reuse in loops or other sub-cadences, or using a sub-cadence to
sort of "pause" the control flow, execute a function, and then let Cadence
continue.

Cadence is an example of ***syntax bashing***: extending the syntax of a
computer language using the existing syntax, latching onto meta-data such as
type or class data.

Unlike method-chaining or other forms of syntax-bashing, cadence users a single
`step` function with which you can define asynchronous parallel operations.
