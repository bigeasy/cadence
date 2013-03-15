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

  function begin (steps, vargs, callback) {
    var invocation = {
      callbacks: [{ results: [[invoke].concat(vargs)] }]
    };
    invoke.call(this, steps, 0, invocation, callback);
  }

  // Execute is the function returned to the user. It represents the constructed
  // cadence. When the user invokes it with no arguments, a default error
  // throwing callback is used for the cadence callback. If the user provides
  // any arguments, the user must also provide a callback.
  function execute () {
    var vargs = __slice.call(arguments, 0),
        callback = function (error) { if (error) throw error };
    if (vargs.length) callback = vargs.pop();
    begin.call(this, steps, [async].concat(vargs), callback);
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
  function async () { return _async.apply(null, arguments) }

  function _async() {
    var vargs = __slice.call(arguments, 0), i = -1, step, original;

    // The caller as invoked the async function directly as an explicit early
    // return to exit the entire cadence.
    if (vargs[0] === null || vargs[0] instanceof Error) {
      invocations[0].count = Number.MAX_VALUE;
      invocations[0].callback.apply(null, vargs);
      return;
    }

    // If our first argument is a function, we check to see if it is a jump
    // instruction. If the function is a member of the current cadence, we
    // will inovke that function with the results of this step.

    // Search for the function in the current cadence.
    if (vargs.length == 1 && typeof vargs[0] == "function") {
      original = vargs[0].original || vargs[0];
      for (i = invocations[0].args[0].length - 1; step = invocations[0].args[0][i]; i--) {
        if (original === step || original === step.original) break;
      }
    }

    // If we find the function in the current cadence, we set the index of
    // next step function to execute; then remove the function argument and
    // procede.
    if (~i) {
      invocations[0].args[1] = i;
      vargs.shift();
    }

    var callback = { errors: [], results: [] };
    invocations[0].callbacks.push(callback);

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
    if (Error === vargs[0]) {
      invocations[0].catchable = callback.catchable = !! vargs.shift();
    }
    callback.cadence = vargs;
    if (vargs.length) {
      if (!vargs.every(function (arg) { return typeof arg == "function" })) {
        throw new Error("invalid arguments");
      }
      if (!fixup) return createCadence(invocations[0], callback);
    }
    if (callback.arrayed) return createArray(invocations[0], callback);
    return createCallback(invocations[0], callback, 0);
  }

  function createCadence (invocation, callback) {
    var index = 0;
    callback.run = ! callback.arrayed;
    return function () {
      var vargs = __slice.call(arguments);
      runSubCadence(invocation, callback, index++, vargs);
    }
  }

  function createArray (invocation, callback) {
    var index = 0;
    return function () {
      var vargs = __slice.call(arguments);
      if (index < 0) throw new Error("zero-to-many already determined");
      if (Array.isArray(vargs[0])) {
        index = -2;
      }
      return createCallback(invocation, callback, index++);
    }
  }

  function createCallback (invocation, callback, index) {
    if (-1 < index) invocation.count++;
    return function (error) {
      var vargs = __slice.call(arguments, 1);
      if (error) {
        thrown(invocation, error, callback);
      } else {
        if (index < 0) callback.results.push(vargs);
        else callback.results[index] = vargs;
        if (callback.cadence.length) {
          invocation.count++;
          begin.call(invocation.self, callback.cadence, callback.results[index], function (error, result) {
            if (error) {
              thrown(invocation, error);
            } else {
              callback.results[index] = __slice.call(arguments, 1);
            }
            if (-1 < index && ++invocation.called == invocation.count) {
              invoke.apply(invocation.self, invocation.args);
            }
          });
        }
        // Indicates that the function has completed, so we need create
        // the callbacks for parallel cadences now, the next increment of
        // the called counter, which may be the last.
        if (vargs[0] == invoke) {
          invocation.callbacks.filter(function (callback) { return callback.run }).forEach(function (callback) {
            runSubCadence(invocation, callback, 0, []);
          });
        }
      }
      if (index > -1 && ++invocation.called == invocation.count) {
        invoke.apply(invocation.self, invocation.args);
      }
    }
  }

  function runSubCadence (invocation, callback, index, vargs) {
    delete callback.run;
    var steps = callback.cadence;
    invocation.count++;
    begin.call(invocation.self, steps, vargs, function (error) {
      var vargs = __slice.call(arguments, 1);
      if (error) {
        thrown(invocation, error);
      } else {
        callback.results[index] = vargs;
      }
      if (++invocation.called == invocation.count) {
        invoke.apply(invocation.self, invocation.args);
      }
    });
  }

  function thrown (invocation, error, callback) {
    var steps = invocation.args[0], next = steps[invocation.index + 1];
    if (next && callback.catchable) {
      callback.errors = [ error ];
    } else {
      invocation.abended = true;
      invocation.callback(error);
    }
  }

  // Parallel arrays make the most sense, really. If the paralleled function
  // is better off returning a map, it can be shimmed.
  function contextualize (step, callbacks) {
    var index, vargs = [], arg, callback, arity;

    arg = 0;
    while (callbacks.length) {
      callback = callbacks.shift();
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

  function invoke (steps, index, previous, callback) {
    var callbacks = previous.callbacks, args = [], arg, step, result, hold;

    if (previous.thrown) {
      callback(previous.thrown);
      return;
    }
    if (previous.abended) return;


    var caught = [];
    if (previous.catchable) {
      var caught = callbacks.filter(function (callback) { return callback.errors.length });
    }

    if (steps[index] && previous.catchable && !caught.length) {
      previous.catchable = false;
      invoke.call(this, steps, index + 1, previous, callback);
    } else {
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
      if (caught.length) {
        args = callbacks.filter(function (callback) {
          return callback.catchable;
        }).map(function (callback) {
          return callback.errors.shift();
        });
      } else {
        if (callbacks.length) {
          args = contextualize(step, callbacks);
        } else {
          args = [];
        }
      }

      if (steps.length == index) {
        callback.apply(null, [ null ].concat(args));
        return;
      }

      // Get the next step.
      step = steps[index];

      invocations.unshift({ callbacks: [], count: 0 , called: 0, index: index,
                            callback: callback, self: this });
      invocations[0].args = [ steps, index + 1, invocations[0], callback ]

      hold = async();
      try {
        result = step.apply(this, args);
      } catch (error) {
        // We're not a replacement for try/catch, so set up the next step for
        // failure, ensure that our hold function invokes the next step.
        invocations[0].thrown = error;
        invocations[0].called = invocations[0].count - 1;
      }
      invocations.shift();
      hold.apply(this, [ null, invoke ].concat(result === void(0) ? [] : [ result ]));
    }
  }

  return execute;
}

module.exports = cadence;
