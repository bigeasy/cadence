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
    invoke(steps, 0, invocation, callback);
  }

  function execute () {
    var vargs = __slice.call(arguments, 0),  callback = exceptional;
    if (vargs.length) callback = vargs.pop();
    begin(steps, [async].concat(vargs), callback);
  }

  function exceptional (error) { if (error) throw error }

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
    if (vargs.length && (vargs[0] == null || vargs[0] instanceof Error)) {
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
      for (i = invocations[0].arguments[0].length - 1; step = invocations[0].arguments[0][i]; i--) {
        if (original === step || original === step.original) break;
      }
    }

    // If we find the function in the current cadence, we set the index of
    // next step function to execute; then remove the function argument and
    // procede.
    if (~i) {
      invocations[0].arguments[1] = i;
      vargs.shift();
    }

    var fixup;
    if (fixup = (vargs[0] === async)) {
      vargs.shift();
    }
    if (!isNaN(parseFloat(vargs[0])) && isFinite(vargs[0])) {
      var arity = parseInt(vargs.shift(), 10);
    }
    if (Array.isArray(vargs[0]) && vargs[0].length == 0) {
      var arrayed = !! vargs.shift();
    }
    if (Error === vargs[0]) {
      var catchable = !! vargs.shift();
    }
    if (vargs.length && vargs.every(function (arg) { return typeof arg == "function" })) {
      var cadence = vargs.splice(0, vargs.length);
    }

    // If we have no arguments, or else if every argument is a string, then
    // we've been asked to build a callback, otherwise, this is a sub-cadence.

    //
    if (cadence && !fixup) {
      return createCadence(invocations[0], arity, cadence, arrayed);
    } else {
      if (vargs.length) throw new Error("invalid arguments");
      if (arrayed) {
        return createArray(invocations[0], arity, cadence);
      } else {
        return createScalar(invocations[0], arity, cadence, catchable);
      }
    }
  }

  function createCadence (invocation, arity, cadence, arrayed) {
    var callback = { results: [], run: ! arrayed, cadence: cadence, arrayed: arrayed }, index = 0;
    if (arity) callback.arity = arity;
    invocation.callbacks.push(callback);
    return function () {
      var vargs = __slice.call(arguments);
      runSubCadence(invocation, callback, index++, vargs);
    }
  }

  function createArray (invocation, arity, cadence) {
    var callback = { results: [], cadence: cadence }, index = 0;
    if (arity) callback.arity = arity;
    callback.arrayed = true;
    invocation.callbacks.push(callback);
    return function () {
      var vargs = __slice.call(arguments);
      if (callback.built) throw new Error("already zero to many");
      if (Array.isArray(vargs[0])) {
        index = -1;
        callback.built = true;
      }
      return createCallback(invocation, callback, index++);
    }
  }

  function createScalar (invocation, arity, cadence, catchable) {
    var callback = { results: [], cadence: cadence, catchable: catchable };
    if (arity) callback.arity = arity;
    invocation.callbacks.push(callback);
    invocation.catchable = invocation.catchable || catchable;
    return createCallback(invocation, callback, 0);
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
        if (callback.cadence) {
          invocation.count++;
          begin(callback.cadence, callback.results[index], function (error, result) {
            if (error) {
              thrown(invocation, error);
            } else {
              callback.results[index] = __slice.call(arguments, 1);
            }
            if (-1 < index && ++invocation.called == invocation.count) {
              invoke.apply(null, invocation.arguments);
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
        invoke.apply(null, invocation.arguments);
      }
    }
  }

  function runSubCadence (invocation, callback, index, vargs) {
    delete callback.run;
    var steps = callback.cadence;
    invocation.count++;
    begin(steps, vargs, function (error) {
      var vargs = __slice.call(arguments, 1);
      if (error) {
        thrown(invocation, error);
      } else {
        callback.results[index] = vargs;
      }
      if (++invocation.called == invocation.count) {
        invoke.apply(null, invocation.arguments);
      }
    });
  }

  function thrown (invocation, error, callback) {
    var steps = invocation.arguments[0], next = steps[invocation.index + 1];
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
      var caught = callbacks.filter(function (callback) { return callback.errors && callback.errors.length });
    }

    if (steps[index] && previous.catchable && !caught.length) {
      previous.catchable = false;
      invoke(steps, index + 1, previous, callback);
    } else {
      // No callbacks means that we use the function return value, if any.
      if (callbacks.length == 1) {
        if (callbacks[0].results[0][0] === invoke) {
          callbacks[0].results[0].shift()
        }
        if (!callbacks[0].results[0].length) {
          callbacks.shift();
        }
      } else {
        callbacks = callbacks.filter(function (callback) {
          return !callback.results.length || callback.results[0][0] !== invoke
        });
      }

      if (steps.length == index) {
        callback.apply(null, [ null ].concat(callbacks.length == 1 ? callbacks[0].results[0] : []));
        return;
      }

      // Get the next step.
      step = steps[index];

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

      invocations.unshift({ callbacks: [], count: 0 , called: 0, index: index, callback: callback });
      invocations[0].arguments = [ steps, index + 1, invocations[0], callback ]

      hold = async();
      try {
        result = step.apply(null, args);
      } catch (error) {
        // We're not a replacement for try/catch, so set up the next step for
        // failure, ensure that our hold function invokes the next step.
        invocations[0].thrown = error;
        invocations[0].called = invocations[0].count - 1;
      }
      invocations.shift();
      hold.apply(null, [ null, invoke ].concat(result === void(0) ? [] : [ result ]));
    }
  }

  return execute;
}

module.exports = cadence;
