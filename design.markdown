# Design

Outline...

 * The curse of time and attention.
 * Inhabiting the cracks in convention.

[Merlin Mann](http://youlooknicetoday.com/)  writes about time and attention and
creative work. His thesis is that if you give your time and attention to any
endeavour, you are rewarded with insights into your endeavour. Give it your time
and attention and it will give you direction. Take the direction.

There is a corollary, that when you're compelled to give your time and attention
to an aspect of your endeavour that is not at the heart of your endeavour, those
insights still come, they hound you with direction, until you finally succumb to
the hounding and set out to codify your insights in code.

This is why there are so many unit test frameworks. It is the programmer's
prayer: This is my unit testing framework. There are many like it, but this one
is mine.

A JavaScript developer is going to spend a lot of time considering the control
flow given the prevalence of callbacks in JavaScript programming. I am such a
JavaScript developer. The more I work with JavaScript, the more I think about
how to work with copious callbacks, the more I want to codify those thoughts in
a library that does what I feel the existing libraries don't.

Oddly, I was very happy using language extensions to make callbacks go away, but
libraries that are not pure JavaScript suffer for adoption in Node.js.
Converting these libraries to pure JavaScript meant a callback explosion.

I've given control flow more than enough time and attention now, especially in
navigating the many tiny evented steps in
[Strata](https://github.com/bigeasy/strata), that I'd like to have a place to
explore the insights. That would be this project.

Which is why Cadence is a curse of insight. It's not that I'm confident that I
have a better solution than those that exist. There appears to be room for
improvement, but that could simply be an assumption that comes from frustration,
one that could be entirely ungrounded. If there is room for improvement, I'm not
confident that I'll find that room or know what to do once I'm in it.

## A Bunch of Unrecorded Decisions

It is not my intention at the time of this commit to back fill the decisions
I've already made, I'm primarily interested in working through the decisions
that I've not been able to make through noodling alone.

 * Use of `_` before a callback to indicate that function takes no arguments.
 * How we're not that concerned about events that may or may not happen.

Super important that the common cases require less punctuation, even if it ruins
the consistency. Key here is `step(function () {});` to create a sub-cadence,
without having to deal with a return value.

This...

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step());

  }, function (body) {

    console.log(body.split(/\n/).length);
    
  });
});
```

Not this...

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step());

  }, function (body) {

    console.log(body.split(/\n/).length);
    
  })(); // NO!
});
```

Whenever I've done that, I've hated it and forgot the invocation anyway.

Here's a couple ideas...

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step());

  }, function (body) {

    console.log(body.split(/\n/).length);
    
  }).happy('happy').joy('joy')
    .inscrubulate(2.2219, require('underscore'), 1 + 1 === 4)
    .invoke('roger all systems go')
    .oh('I forgot to say...').please();
});
```

...that make me want to cry. No method chaining. No. Method. Chaining.

## The Cadence Beastiary

Cadence uses an function named `step` that is a magic function; if you call it
with different sorts of parameters, it will behave differently.

What sorts of parameters can we use with step? That is something to layout when
designing the API that will use step; a list of the different beasties that we
can give to step, so we can assign a meaning to each beastie. Look for my

```javascript
cadence(function (step) {
  
  step();           // arguments.length == 0;
  step([]);         // Array.isArray(arguments[0]);
  step({});         // typeof arguments[0] == "object"
  step('');         // typeof arguments[0] == "string"
  step('a');        // /^a$/.test(arguments[0]);
  step(1);          // !isNaN(parseInt(arguments[0], 10)) && isFinite(arguments[0]);
  step(null);       // arguments[0] === null;
  step(this);       // arguments[0] === this;
  step(step);       // arguments[0] === step;
  step(cadence);    // arguments[0] === cadence;

  step(named);      // Named function, see sub-cadences below.

  step(new Error);          // arguments[0] instanceof Error
  step(new EventEmitter);   // arguments[0] instanceof EventEmitter
  step(new EventEmitter);   // typeof arguments[0].on == "function"

  // Sub-cadences.
  // arguments.every(function (a) { return typeof a == 'function' });
  step(function (value, step) {

    // In the above step will terminate the function list.

  }, function named () {

    // We can have named functions that appear in the context.

  }, function _ (value, name) {

    // We can have special names, or decorators, that change interpretation of
    // the signature.

  }, function name$flag$option (value, name) {

    // We could use a special character to denote flags.
  
  }, function name$ig (value, name) {

    // Or, like regular expressions, we can have single character switches.

  }, function ($name, value) {

    // Currently, starting with a `$` means we want to get the value, but we
    // don't want it to be kept in context.

  }, function (named) {

    // We can reference functions named in the cadence and jump too them.
    if (1 == 1) fs.readdir(".", step(named));
    else step(named)(null, []);

  }, function (_) {

    // This still exists to support Streamline.js.

  }, function (callback) {

    // Create an old-fashioned callback, but maybe this is generalized.

  });

  // Signatures.

  // Mix or match.
  step([0]);
  step({ $trigger: 3 });
});
```

In the beastiary we can detect an empty argument list, we can have the length of
the arguments mean something; if we pass a number and a string, the number could
be the number of times we print the string, but if we pass just a number, then
it could mean the number of seconds to wait before exiting. Nonsense example,
but you get the picture.

I require that the caller gives us an actual type, that it doesn't trigger any
of the [typing
pitfalls](http://webreflection.blogspot.ie/2012/06/javascript-typeof-operator-problem.html).
About those I simply do not care. Those are "Doctor it hurts when I do this."
problems, problems that a latched onto by those lookign to be Nerd Perfect(tm).

Not only can we accept strings, but we can run regular expressions against
strings so that they have different meanings.

Currently, assignments are...

 * Arrays of functions are sub-cadences.
 * Integers indicate arity.
 * An array indicates an array of responses.
 * Order of invocations of step establish the order of arguments to subsequent
 functions.

Arrays of functions are sub-cadences.

## Sub-Cadence as Callback?

Curious, found a great usage for a sub-cadence as callback. Here's where the
cracks of the convention may be filled, so...

## Inhabiting the Cracks in Convention

In a callback of the following form, the `error` is supposed to be an `Error`
object by convention.

```javascript
function (error, result) {
}
```

When it is not an error object, it can be an indicator that the callback is
supposed to do something else. 

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step());

  }, function (body) {

    console.log(body.split(/\n/).length);
    
  });
});
```

In the above, `step()` creates the callback invoked by `readFile`.

```javascript
cadence(function (step) {
  step(function () {

    var splitter = step();
    fs.readFile(__filename, "utf8", splitter(function (body) { return body.split(/\n/) }));

  }, function (lines) {

    console.log(lines.length);
    
  });
});
```

In the above, we create a callback then create a wrapper, when our callback gets
a function as it's first argument, it knows that it is going to run a
sub-cadence against the result.

This collides with the use of sub-cadences with `forEach` below.

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step()(function (body) { return body.split(/\n/) }));

  }, function (lines) {

    console.log(lines.length);
    
  });
});
```

The assumption here is that in ordinary operation, noone is going to call us
back with `typeof error === "function"`, but they could, I suppose, if they
really wanted to.

We could be more explicit, using one of our special variables.

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step()(step, function (body) { return body.split(/\n/) }));

  }, function (lines) {

    console.log(lines.length);
    
  });
});
```

Which would be awful hard for anyone to abuse us with.

Ah, but then, why not...

```javascript
cadence(function (step) {
  step(function () {

    fs.readFile(__filename, "utf8", step(step, function (body) { return body.split(/\n/) }));

  }, function (lines) {

    console.log(lines.length);
    
  });
});
```

This reads to me as, create a `step` callback, but run this sub-cadence against
the response, here's a sub-cadence in a callback, i.e. `step(step`.

Now we can address the problem of a callback that might not be called, this
imaginary creature, something I've yet to see in the wild...

```javascript
cadence(function (thing) {
  step(function () {

    thing.happensWhenDone(step());
    thing.mayOrMayNotHappen(step(step, []));

  }, function (definately, maybe) {

    console.log(definately, maybe.length);
    
  });
})(require("thing"));
```

Looks like I'm not going to make use of an overloaded `error`.

## Order and Arity of Subsequent Functions

It appears that there would be a common case when working with `fs` where you'd
want to invoke a callback for a list of items, gathering the results into a list
for further processing, or even running them through a pipeline. It is difficult
to imagine how far one needs to take parallelism at this point, but I keep using
the example of descending a directory with the Node.js `fs` package when
considering how to facilitate this operation with Cadence.

Currently, I'm trying to determine how to specify the order of the arguments
passed to the subsequent function in the cadence.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      listing.forEach(function (file) {
        fs.stat(file, step());
      });

    }, function (stats, listing) {

      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', step());
        }
      });

    }, function (bodies) {

      if (bodies.length) {
        process.stdout.write(bodies.concat([ '' ]).join('\n'));
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

The problem with the above is this; what happens if `step()` is not called? In
the case of the listing, the target directory might be empty. In the case of the
modified time, there may be no newer files.

The signature of the subsequent function is determined by the arguments in the
callback to function generated by `step()`. If step is not called because of an
empty set, then the signature of the subsequent function changes.

We're not going to see the worst of the change in this case. If the listing is
empty, then the stats argument to the subsequent function is `null`. This is not
unreasonable, but it means we have to check for `null` instead of calling
`forEach` on a zero length array. However, in a case where we're looping,
jumping to a previous point in the cadence, we'd read the current value of
`listing`, it would not be overwritten.

The type change is enough of an annoyance. If the callback to `step()` is not
called, there is no value to set parameter in the subsequent signature, but
there a problem if it is called only once, since we don't know if we should
expect more calls. In many instances, we only expect there to be a single
invocation of the `step()` callback. In these cases, we want a scalar value.


```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, step) {

  fs.readFile(path, 'utf8', step());

}, function (body) {

  process.stdout.write(body);

})(__filename);
```

In the above example, we do not want an array of one file body, we want the one
file body as a scalar variable. In our directory listing code, however, we might
have a directory that has only one entry. Thus, `step()` is called only once,
which could mean scalar, or it could mean an array.

We're leaning toward getting around the array problem by declaring an array type
in the call to step by passing an empty array.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      listing.forEach(function (file) {
        fs.stat(file, step([]));
      });

    }, function (stats, listing) {

      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', step([]));
        }
      });

    }, function (bodies) {

      if (bodies.length) {
        process.stdout.write(bodies.concat([ '' ]).join('\n'));
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

This solves the problem of differentiating from scalar and array, but it does
not solve the problem of an empty listing. If `step()` is not called, there is
no indication to Cadence that a value is expected.

To solve this, I moved to having a declaration of an array.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      var stats = step([]);
      listing.forEach(function (file) { fs.stat(file, stats()); });

    }, function (stats, listing) {

      var bodies = step([]);
      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', bodies());
        }
      });

    }, function (bodies) {

      if (bodies.length) {
        process.stdout.write(bodies.concat([ '' ]).join('\n'));
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

Along the way, were were some incantations. Starting with having `step([])`
generate a callback.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      var stats = step([listing.length]);
      listing.forEach(function (file) { fs.stat(file, stats); });

    }, function (stats, listing) {

      var bodies = step([]);
      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', bodies(1));
        }
      });

    }, function (bodies) {

      if (bodies.length) {
        process.stdout.write(bodies.concat([ '' ]).join('\n'));
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

In the above, we put a numeric value in the array to indicate that that step
function will have that many callbacks. In the case of stats, we know already
how many stats we're supposed to have, so we can declare our `stats` callback
with a callback count.

Except now we don't know the index of callback. In our solution before this one,
when we call `stat()`, we know that the callback will append to the array at the
current length of the array, each invocation adds an element. With this
solution, we'd have to add our answers as they arrive, no inidcation of the
index. Breakage one.

If the order didn't matter, then this would be fine, but it will, almost
always, because parallel arrays is what we do.

Next we'd overload the `error` of the callback to look for a count. When the
array is specified without a count, it will not count on anything to return. We
need to tell it to wait by invoking the callback with a count to increment the
number of times we're supposed to wait. If we didn't like overloading the return
value, then we run it through `step`.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      var stats = step([listing.length]);
      listing.forEach(function (file) { fs.stat(file, stats); });

    }, function (stats, listing) {

      var bodies = step([]);
      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', step(bodies, 1));
        }
      });

    }, function (bodies) {

      if (bodies.length) {
        process.stdout.write(bodies.concat([ '' ]).join('\n'));
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

I don't see a second breakage, but I like the notion of being explicit in
calling these. I can't imagine a case of using an `error` callback where things
might not happen. We looked at using `step` to create  callbacks above, but I
imagine that when we have the zero to many issue arrise with callbacks, we could
so something like the following.

```javascript
step(function (thing) {

  var items = step([]);
  thing.mayOrMayNotCall(function (error, result) {
    items()(error, result);
  });
  thing.willCallWhenDone(step());

}, step (items, done) {

  console.log({ items: items, done: done });

});
```

Not bad and for the uncommon case.

Now getting back to the solution we settled on, we're losing track of the
details of our bodies, so can use an inner cadence, a cooking cadence, to gather
up our data into an object.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (path, since, step) {

    step(function () {

      fs.readdir(path, step());

    }, function (listing) {

      var stats = step([]);
      listing.forEach(function (file) { fs.stat(file, stats()); });

    }, function (stats, listing) {

      var bodies = step([]);
      stats.forEach(function (stat, index) {
        if (stat.mtime > since) {
          fs.readFile(listing[index], 'utf8', bodies(step, function (body) {
            return {
              name: listing[index],
              stat: stat,
              body: body
            }
          }));
        }
      });

    }, function (files) {

      if (files.length) {
        files.forEach(function (file) {
          console.log("file: " + file.name + ", size: "  + file.stat.size + ", first line:");
          console.log(file.body.split(/\n/).shift() + "\n");
        });
      }

    });;

})(".", +(new Date()) - 1000 * 60 * 10);
```

## Sub-Cadences

I need to go and back fill, here, but there are ways in which I expect Cadence
to work, such as, when the `step` function is used to create a sub-cadence, that
sub-cadence will produce a result that will appear in the parameters passed to
the subsequent function.

Let's way we want to gather up the file contents and file meta data for an
entire directory.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    step(function () {

        fs.readdir(directory, step());

    }, function (files, step) {

      files.forEach(function (file) {
        step(function () {

          fs.stat(path.join(directory, file), step());

        }, function (stat) {

          fs.readFile(path.join(directory, file), step());

        }, function (body, stat) {

          return { name: file, stat: stat, body: body };

        });
      });

    }, function (objects) {

      // Superfluous step here. It would have been returned from the previous
      // function out to the caller.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

It is my intent that the above would create an array of objects containing the
file name, status, and contents of each file.

Unlike a callback declaration, a declaration of a sub-cadence does not produce a
new parameter in the subsequent function. For each declaration of a callback, a
new parameter is added to the subsequent function, but a sub-cadence will always
gather up its results into an array.

Why? Okay. Here's the same problem. If there are no entries in the directory,
then the sub-cadence declaration will not be invoked. If it is not invoked, then
we don't know to expect it. The `objects` value (superfluous since it will be
returned up through to the caller) will be either an array or null. I need to
declare that step.

The outer step is simple enough. It is declared once, so we know that it will
return a scalar, like a callback `step` invocation.

The problem is now that we've created this sub-cadence that need to be declared
outside of our for each loop, but we need to define our functions using the
closure that will capture the `file`.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    step(function () {

        fs.readdir(directory, step());

    }, function (files, step) {

      files.forEach(step([], function (file) {

        fs.stat(path.join(directory, file), step());

      }, function (stat, file) {

        fs.readFile(path.join(directory, file), step());

      }, function (body, stat, file) {

        return { name: file, stat: stat, body: body };

      }));

    }, function (objects) {

      // Superfluous step here. It would have been returned from the previous
      // function out to the caller.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

The above solution would be to have our `step` sub-cadence invocation return a
function that constructs a step each time it is called. The initial array
parameter tells `step` that this is arrayed, it builds a function that will feed
it's arguments into the first step of the cadence.

This invocation of step will strip arity and type arguments off of the front of
the argument list, the presence of one or more functions thereafter indicates
that the invocation is a sub-cadence.

However, in our above example, it could be the case that some of the files in
the directory are other directories.

Each file needs a call to `stat`, but not all of
them will go onto `readFile`. I can see a solution that works with an object in
a scope outside of the inner cadence.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    var objects = [];

    step(function () {

        fs.readdir(directory, step());

    }, function (files, step) {

      files.forEach(function (file) {

        step(function () {

          fs.stat(path.join(directory, file), step());

        }, function (stat, file) {

          if (!stat.isDirectory()) {

            step(function () {

              fs.readFile(path.join(directory, file), step());

            }, function (body, stat, file) {

              objects.push({ name: file, stat: stat, body: body });

            })

          });

      });

    }, function _() {

      // Ignore return and return our objects array.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

Not that much different from a hoisted function solution. What would actually go
inside the inner loop that

Each call to step indicates both a callback and a spot in the array. How do we
separate the callback from the spot in the array?

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    step(function () {

      fs.readdir(directory, step());

    }, function (files, step) {

      var objects = step([], function (body, stat, file) {

        return { name: file, stat: stat, body: body };

      });

      var stats = step([], function (file) {

        fs.stat(path.join(directory, file), step());

      }, function (stat, file) {

        if (stat.isDirectory()) fs.readFile(path.join(directory, file), objects(file));

      }, function _(stat) {

        return stat;

      });


      files.forEach(function (file) {
        stats(file);
      });

    }, function (objects) {

      // Superfluous step here. It would have been returned from the previous
      // function out to the caller.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

The above solution would use fact that `objects` is declared before `stats` to
establish the order of parameters to the subsequent function. Each call to stats
causes Cadence to wait for a return, but the sub-cadence would invoke the
objects sub-cadence, which would schedule an additional return and create space
in the objects array. 

At the end of the stat sub-cadence is a return that ensure that we always return
something from the stat sub-cadnece, even though we don't use it. This would
probably be the case most of the time, making this an invitation to busy work,
or comments along the lines of, "we don't need the return value so we don't
worry if this returns undefined."

This design would be nightmarish, but it helps to flesh out alternatives,
because until I'm able to see how bad it is, it is going to nag. I suppose this
is meta and about the design process, but when I'm holding this in my head, I
will think of this again, what if you composed sub-cadences? What if one
sub-cadence called another, so you could use the same odering logic? Then I have
to think about it, realize that it doesn't look or read right, then wait a day
or two and think, what if you composed sub-cadences? What if one sub-cadence
called another, so you could use the same odering logic?

It is good to have a catalog of what was said by the voices you heard calling
you into dark alleys.

Here's let's experiment with the concept of an early return, which is an
undocumented decision, but one that is still implemented.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    step(function () {

        fs.readdir(directory, step());

    }, function (files, step) {

      files.forEach(step([], function (file) {

        fs.stat(path.join(directory, file), step());

      }, function (stat, file) {

        if (stat.isDirectory()) step(null);
        else fs.readFile(path.join(directory, file), step());

      }, function (body, stat, file) {

        return { name: file, stat: stat, body: body };

      }));

    }, function (objects) {

      // Superfluous step here. It would have been returned from the previous
      // function out to the caller.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

When you call step with either `null` or an `Error` as the first argument, the
cadence will return immediately and not continue with the next step. If the
first argument is an `Error`, then the cadence ends immediately with `Error` as
the error result. If the first argument is `null`, it is as if you were invoking
a callback, `null` indicates no error, what follows is the return value for the
callback.

When the early exit is invoked with no additional arguments, we'll interpret
that to mean that no return value is provided, and therefore the element should
be eliminated from the result set.

From the bestiary, at this point in the design, we could use a different
indicator to indicate an early return such as `step(this)` or `step(step)`, but
upon some reflection, that is no shorter than `step(null)`. However, if we end
up wanting `null` to mean something else, such as a scalar event that may not be
triggered, we might have to use `null` for that purpose.

However, if that is the case, one can use an array, and check the array length,
or if they really want `undefined`, they can call `shift` and see what they get.

The semanics of using an array in that case would have to be super annoying and
the use case would have to be super common, but I can't even imagine an example
of a scalar event that might not happen other than `error`, and I've got `error`
covered.

While we're looking  at this, let's consider how far we can nest cadences.

```javascript
var fs = require('fs'), cadence = require('cadence');

cadence(function (directory, since, step) {

    step(function () {

        fs.readdir(directory, step());

    }, function (files, step) {

      files.forEach(step([], function (file) {

        var resolved = path.join(directory, file);

        step(function () {

          fs.stat(resolved, step());

        }, function (stat, file) {

          if (stat.isDirectory()) step(null);
          else fs.readFile(resolved, step());

        }, function (body, stat, file) {

          return { name: file, stat: stat, body: body };

        });

      }));

    }, function (objects) {

      // Superfluous step here. It would have been returned from the previous
      // function out to the caller.

      return objects;

    });

})(".", function (error, results) {
  if (error) throw error;
  console.log(results);
});
```

It would appear that the early return would work here as well. The return
would propagate to the outer function.

## Events

With so much sorted out, events ought to get easier.

```javascript
var cadence = require('cadence')(function (object, step) {
  if (object.on && object.stdout && object.stderr) {
    // Magic. 
  }
});

cadence(function () {

  step(function () {

    var prog = spwan('chatty', []);

    // Hummm... Use an array to make things look like Objective-C for
    //          no good reason?
    step([prog, 'exit'], 2); // Need to specify arity.
    step([prog, 'error'], 2); // 'error' is special
    step([prog.stdout, 'data', []]);
    step([prog.stderr, 'data', []]);

    // Hermm... Use `this` to mean object based?
    prog.on('exit', step(this, 2));
    prog.on('error', step(this, 'error'));
    prog.stdout.on('data', step(this, []));
    prog.stderr.on('data', step(this, []);

    // Erp... All errors at once?
    step(this, 'error', prog, prog.stdout, prog.stderr);

    // Custom handlers?
    step(this, spawn);

    // Argh... What do we have left in the beastiary?
    var on = step(prog, prog.on);
    on('exit', 2);
    on('error', 'error');

    // Create a callback builder?
    var on = step(this, 'on');
    on(prog, 'exit', 2);
    on(prog.stdout, 'data', []);
    on(prog.stderr, 'data', [], function (data) {
      return data.map(function (buffer) { return buffer.toString() }).join('');
    });
    // Objects first, then action, then definition. ('error' is special.)
    on(prog, prog.stdout, prog.stderr, 'error');

  }, function (code, signal, stdout, stderr) {


  });

});
```

Okay, it's not easier. What needs to happen is that the first argument to a
callback is shifted. Events will have events that do not get called, here might
be more of a concept of null events, as opposed to definate events versus zero
to many events.
