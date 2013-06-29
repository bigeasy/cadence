var __slice = [].slice;
/*
function die () {
  console.log.apply(console, __slice.call(arguments, 0));
  process.exit(1);
}

function say () { console.log.apply(console, __slice.call(arguments, 0)) }
*/
function cadence () {
  var steps = __slice.call(arguments, 0);

  function begin (caller, cadence, vargs, callback) {
    // TODO: We pass this forward, better as a parent?
    var invocation = {
      caller: caller,
      errors: [],
      finalizers: [],
      __args: vargs
    };
    invoke.call(this, cadence, 0, invocation, callback);
  }

  // Execute is the function returned to the user. It represents the constructed
  // cadence. When the user invokes it with no arguments, a default error
  // throwing callback is used for the cadence callback. If the user provides
  // any arguments, the user must also provide a callback.
  function execute () {
    var vargs = __slice.call(arguments, 0),
        callback = function (error) { if (error) throw error };
    if (vargs.length) callback = vargs.pop();
    begin.call(this, null, unfold({}, steps), [async].concat(vargs), function (errors) {
      if (errors) {
        if (callback) callback(errors.shift());
        else throw errors.shift();
      } else if (callback) {
        callback.apply(null, [null].concat(__slice.call(arguments, 1)));
      }
    });
  }

  // To use the same `step` function throughout while supporting reentrancy,
  // we keep a stack of invocation objects. The stack is reversed; top is 0.
  // The `step` function is synchronous and will return immediately.
  //
  // It is possible for the user to invoke `step` outside of a step in a
  // cadence, we can't prevent it, nor really even detect it. Imagine the user
  // invoking `setTimeout` with a callback that calls `step` five minutes
  // later, long after the cadence has ended. Mayhem, but what can you do?
  var invocations = [];

  // We give this function to the caller to build control flow. In the
  // debugger, I often want to step into a function that takes a step
  // callback, so I'm often stepping into this function, only to step right
  // back out again. Step out is a two finger chord in the Chrome debugger,
  // but step over is a single function key, so I want to have the option to
  // step over the body of this function, instead of having to find the
  // control key when I'm in it. That is the only reason for the separate
  // async function.

  //
  function async () { return createHandler.apply(null, arguments) }

  function unfold (callback, steps) {
    callback.errors = [];
    callback.catchers = [];
    callback.steps = [];
    callback.finalizers = [];
    // TODO: No good way to prevent or preserve callbacks. Step function needs
    // to be in array.
    // TODO: Amend: If it matches and only those that match.
     steps.forEach(function (step) {
      if (Array.isArray(step)) {
        if (step.length == 1) {
          callback.finalizers[callback.steps.length] = { step: step[0] }
        } else {
          callback.steps.push(step[0]);
          callback.catchers[callback.steps.length - 1] = function (errors, error) {
            var catcher = step[step.length - 1], caught = true;
            if (step.length == 4) {
              caught = errors.some(function (error) {
                return (typeof step[2] == 'string') ? error[step[1]] == step[2]
                                                    : step[2].test(error[step[1]]);
              });
            } else if (step.length == 3) {
              caught = errors.some(function (error) {
                var value = error.code || error.message;
                return (typeof step[1] == 'string') ? value == step[1]
                                                    : step[1].test(value);
              });
            }
            if (caught) {
              catcher(errors, error);
            }
            return true;
          }
        }
      } else if (typeof step == "function") {
        callback.steps.push(step);
      } else {
        throw new Error("invalid arguments");
      }
    });
    return callback;
  }

  function createHandler () {
    var vargs = __slice.call(arguments, 0), i = -1;

    // The caller as invoked the async function directly as an explicit early
    // return to exit the entire cadence.
    if (vargs[0] === null || vargs[0] instanceof Error) {
      if (vargs[0]) vargs[0] = [ vargs[0] ];
      invocations[0].count = Number.MAX_VALUE;
      invocations[0].callback.apply(null, vargs);
      return;
    }

    var callback = { errors: [], results: [] };
    var fixup;
    if (fixup = (vargs[0] === async)) {
      vargs.shift();
    }
    if (!isNaN(parseInt(vargs[0], 10))) {
      callback.arity = +(vargs.shift());
    }
    if (Array.isArray(vargs[0]) && vargs[0].length == 0) {
      callback.arrayed = !! vargs.shift();
    }
    invocations[0].callbacks.push(callback);
    unfold(callback, vargs);
    if (callback.steps.length) {
      if (!fixup) return createCadence(invocations[0], callback);
    }
    if (callback.arrayed)
      if (this.event) return createCallback(invocations[0], callback, -1);
      else return createArray(invocations[0], callback);
    return createCallback(invocations[0], callback, 0);
  }

  async.event = function () {
    var callback = createHandler.apply({ event: true }, arguments);
    return function () {
      return callback.apply(null, [ null ].concat(__slice.call(arguments)));
    }
  }

  async.error = function () {
    return createHandler.apply({ event: true }, [0, []].concat(__slice.call(arguments)))
  }

  async.jump = function (label) {
    // If our first argument is a function, we check to see if it is a jump
    // instruction. If the function is a member of the current cadence, we
    // will invoke that function with the results of this step.

    // Search for the function in the current cadence. If we find the function
    // in the current cadence, we set the index of next step function to
    // execute; then remove the function argument and proceed.
    var invocation = invocations[0];
    while (invocation) {
      for (var i = 0, I = invocation.args[0].steps.length; i < I; i++) {
        if (invocation.args[0].steps[i] === label) {
          invocation.args[1] = i;
          return;
        }
      }
      invocation = invocation.caller;
    }
  }

  // Create a sub-cadence.
  function createCadence (invocation, callback) {
    var index = 0;
    callback.run = ! callback.arrayed;
    return function () {
      var vargs = __slice.call(arguments);
      runSubCadence(invocation, callback, index++, vargs);
    }
  }

  // Create an arrayed callback.
  function createArray (invocation, callback) {
    var index = 0;
    return function () {
      var vargs = __slice.call(arguments);
      return createCallback(invocation, callback, index++);
    }
  }

  // Create a scalar callback.
  function createCallback (invocation, callback, index) {
    if (-1 < index) invocation.count++;
    return function () {
      var vargs = __slice.call(arguments, 0), error;
      error = vargs.shift();
      if (error) {
        invocation.errors.push(error);
      } else {
        if (index < 0) callback.results.push(vargs);
        else callback.results[index] = vargs;
        if (callback.steps.length) {
          invocation.count++;
          begin.call(invocation.self, invocation,
              callback, callback.results[index], function (error, result) {
            if (error) {
              invocation.errors.push.apply(invocation.errors, error);
            } else {
              callback.results[index] = __slice.call(arguments, 1);
            }
            if (-1 < index && ++invocation.called == invocation.count) {
              argue.apply(invocation.self, invocation.args);
            }
          });
        }
        // Indicates that the function has completed, so we need create
        // the callbacks for parallel cadences now, the next increment of
        // the called counter, which may be the last.
        if (vargs[0] === invoke) {
          invocation.callbacks.filter(function (callback) { return callback.run })
                              .forEach(function (callback) {
            runSubCadence(invocation, callback, 0, []);
          });
        }
      }
      if (index < 0 ? invocation.errors.length : ++invocation.called == invocation.count) {
        argue.apply(invocation.self, invocation.args);
      }
    }
  }

  // Run a sub-cadence.
  function runSubCadence (invocation, callback, index, vargs) {
    delete callback.run;
    invocation.count++;
    begin.call(invocation.self, invocation, callback, vargs, function (errors) {
      var vargs = __slice.call(arguments, 1);
      if (errors) {
        invocation.errors.push.apply(invocation.errors, errors);
      } else {
        callback.results[index] = vargs;
      }
      if (++invocation.called == invocation.count) {
        argue.apply(invocation.self, invocation.args);
      }
    });
  }

  // Parallel arrays make the most sense, really. If the paralleled function
  // is better off returning a map, it can be shimmed.
  function contextualize (step, callbacks) {
    var index, vargs = [], arg, callback, arity;

    arg = 0;
    while (callbacks.length) {
      var callback = callbacks.shift();
      if (callback.arrayed) {
        callback.results = callback.results.filter(function (vargs) { return vargs.length });
      }
      if ('arity' in callback) {
        arity = callback.arity;
      } else {
        arity = callback.arrayed ? 1 : 0;
        callback.results.forEach(function (result) {
          arity = Math.max(arity, result.length);
        });
      }
      for (index = 0; index < arity; index++) {
        vargs.push({ values: [],
                     arrayed: ('arrayed' in callback) ? callback.arrayed : callback.results.length > 1 });
      }
      callback.results.forEach(function (result) {
        for (var i = 0; i < arity; i++) {
          vargs[arg + i].values.push(result[i]);
        }
      });
      arg += arity;
    }

    return vargs.map(function (vargs) { return vargs.arrayed ? vargs.values : vargs.values.shift() });
  }

  // TODO: Always an errors array, check length.
  function finalize (finalizers, index, errors, callback) {
    if (index == finalizers.length) {
      callback(errors.length ? errors : null);
    } else {
      var finalizer = finalizers[index];
      invoke({ steps: [ finalizer.step ], catchers: [], finalizers: [] }, 0, finalizer.previous, function (e) {
        if (e) errors.push.apply(errors, e);
        finalize(finalizers, index + 1, errors, callback);
      });
    }
  }

  function argue (cadence, index, previous, callback) {
    var callbacks = previous.callbacks, args = [], arg, step, result, hold;

    if (previous.errors.length) {
      var catcher = cadence.catchers[index - 1];
      if (catcher) {
        cadence.catchers[index - 1] = null;
        cadence.steps[index - 1] = catcher;
        previous.__args = [ previous.errors, previous.errors[0] ];
        previous.errors = [];
        previous.callbacks.length = 1;
        invoke(cadence, index - 1, previous, callback);
      } else {
        callback(previous.errors);
      }
      return;
    }

    // No callbacks means that we use the function return value, if any.
    if (callbacks.length == 1) {
      callbacks[0].results[0].shift()
      if (!callbacks[0].results[0].length) {
        callbacks.shift();
      }
    } else {
      callbacks.shift();
    }

    // Filter out the return value, if there are callbacks left, then
    // `contextualize` will process them.
    if (callbacks.length) {
      args = contextualize(step, callbacks);
    } else {
      args = [];
    }
    // TODO: Distingish cadence step args from invocation args.
    previous.__args = args;

    invoke.call(this, cadence, index, previous, callback);
  }

  function invoke (cadence, index, previous, callback) {
    var callbacks = previous.callbacks, args = [], arg, step, result, hold;

    args = previous.__args;

    if (cadence.finalizers[index]) {
      previous.finalizers.push(cadence.finalizers[index]);
      cadence.finalizers[index].previous = previous;
    }

    if (cadence.steps.length == index) {
      var finalizers = previous.finalizers.slice();
      previous.finalizers.length = 0;
      finalize(finalizers, 0, [], function (errors) {
        callback.apply(null, [ errors ].concat(args));
      });
      return;
    }

    // Get the next step.
    step = cadence.steps[index];

    invocations.unshift({ callbacks: [], count: 0 , called: 0, index: index,
                          errors: [],
                          finalizers: previous.finalizers,
                          callback: callback, self: this, caller: previous.caller });
    invocations[0].args = [ cadence, index + 1, invocations[0], callback ]

    hold = async();
    try {
      result = step.apply(this, args);
    } catch (error) {
      // We're not a replacement for try/catch, so set up the next step for
      // failure, ensure that our hold function invokes the next step.
      invocations[0].errors.push(error);
      invocations[0].called = invocations[0].count - 1;
    }
    invocations.shift();
    hold.apply(this, [ null, invoke ].concat(result === void(0) ? [] : [ result ]));
  }

  return execute;
}

module.exports = cadence;
