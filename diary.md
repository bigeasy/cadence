## Fri Mar  3 23:56:09 CST 2017

Creating a new diary entry because I'm testing my diary parser.

## Fri Mar  3 22:57:15 CST 2017 ~ stuff, other

Loops could use break and continue and default to looping and breaking from the
Cadence so that there is no error. Then we can have `async.loop`. We can
simplify the default label by assigning it to the `Cadence` object, which we are
doing already anyway, you pass in the loop label.

```
async.loop(function () {
    return [ async.break ]
})
```
