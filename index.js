"use strict";
var __slice = [].slice;

function extend (object) {
  __slice.call(1, arguments).forEach(function (append) {
    for (var key in append) if (append.hasOwnProperty(key)) {
      object[key] = append[key];
    }
  });
  return object;
}

function factory (options) {
  options = options || {};

  return cadence;

  function cadence () {
    var vargs = __slice.call(arguments, 0)
      , steps = []
      , firstSteps = []
      , timer
      , callback
      , callbacks = [ { names: [], vargs: [] } ]
      , called
      , count
      , exitCode = 0
      , cadences = []
      , methods = { cadence: cadence }
      , abended
      , key
      , arg
      , context = extend({}, context)
      ;

    firstSteps = flatten(vargs);

    if (steps.length == 0 && typeof callback == "object") {
      return factory(extend({}, options, callback));
    }

    firstSteps = firstSteps.map(function (step) { return parameterize(step) });

    return execute;

    function execute () {
      callback = arguments[0] || exceptional;
      steps = firstSteps.slice(0);
      cadences.length = 0;
      abended = false;
      invoke(steps, 0, {}, [], callback);
    }

    function exceptional (error) { if (error) throw error }

    function flatten (array) {
      var flattened = [];
      while (array.length) {
        arg = array.shift();
        if (Array.isArray(arg)) {
          while (arg.length) array.unshift(arg.pop());
        } else {
          flattened.push(arg);
        }
      }
      return flattened;
    }

    // Set and reset a thirty second timeout between assertions.
    function timeout () {
      if (timer) clearTimeout(timer);
      if (options.timeout) timer = setTimeout(function () { callback(new Error("Timeout")) }, options.timeout);
    }

    var invocation;

    function cadence () {
      var vargs = __slice.call(arguments, 0), i = -1, step;
      if (vargs.length == 1 && Array.isArray(vargs[0]) && !vargs[0].length) return;
      vargs = flatten(vargs);
      if (vargs.length == 1 && typeof vargs[0] == "function") {
        for (i = invocation.arguments[0].length - 1; step = invocation.arguments[0][i]; i--) {
          if (vargs[0] === step.original || vargs[0] === step) break; 
        }
      }
      if (~i) {
        invocation.arguments[1] = i;
      } else if (!vargs.length || vargs.every(function (arg) { return typeof vargs[0] == "string" })) {
        var names = vargs;
        invocation.count++;
        return (function (invocation) {
          return function (error) {
            var vargs = __slice.call(arguments, 1);
            if (error) {
              thrown.apply(this, [ error ].concat(invocation.arguments));
            } else {
              invocation.callbacks.push({ names: names, vargs: vargs });
              if (vargs[0] == invoke) {
                cadences.slice(0).forEach(function (steps) {
                  invoke(steps.map(parameterize), 0, Object.create(invocation.context), [], cadence());
                });
              }
            }
            if (++invocation.called == invocation.count) {
              invoke.apply(this, invocation.arguments);
            }
          }
        })(invocation);
      } else {
        cadences.push(vargs);
      }
    }

    function parameterize (f) {
      var $ = /^function\s*[^(]*\(([^)]*)\)/.exec(f.toString());
      if (!$) throw new Error("bad function");
      f.parameters = $[1].split(/\s*,\s/);
      return f;
    }

    // Test if a program name matches one of our special names. We support
    // Streamline.js by also accepting a function whose name has been mangled in a
    // Streamline.js fashion.

    //
    function named (proc, name) {
      return proc.name == name || (proc.name && !proc.name.indexOf(name + '__'));
    }

    // TODO And what if there are many, many errors?

    //
    function thrown (error, steps, index, context, callbacks, callback) {
      if (steps.length && steps.length && ~steps[0].parameters.indexOf("error")) {
        context.error = error;
      }
      abended = true;
      if (timer) clearTimeout(timer);
      callback(error);
    }

    // Parallel arrays make the most sense, really. If the paralleled function
    // is better off returning a map, it can be shimmed.
    function contextualize (step, callbacks, context) {
      var inferred = !callbacks[0].names.length
        , names = (inferred ? step.parameters : callbacks[0].names).slice(0)
        , arrayed;
      if (callbacks.length == 1) {
        names.length = callbacks[0].vargs.length;
        callbacks[0].vargs.forEach(function (arg, i) { context[names[i]] = arg });
      } else {
        arrayed = callbacks.every(function (result) {
          return (
            result.vargs.length == names.length
            && ((inferred && !result.names.length)
                || names.every(function (name, i) { return name == result.names[i] }))
          );
        });
        if (arrayed) {
          names.length = callbacks[0].vargs.length;
          names.forEach(function (name, i) { context[name] = [] });
          callbacks.forEach(function (result) {
            result.vargs.forEach(function (arg, i) {
              context[names[i]].push(arg);
            });
          });
        } else {
          throw new Error("Can't infer array assignment.");
        }
      }
      return names;
    }

    function invoke (steps, index, context, callbacks, callback) {
      var arg
        , args = []
        , match
        , parameter, parameters
        , i, I
        , calledback
        , step, key, next
        , leaked
        , result
        , value
        , names
        ;

      if (abended) return;

      timeout();

      if (steps.length == index) {
        callback(null);
        return;
      }

      // Get the next step.
      step = steps[index];

      // No callbacks means that we use the function return value as the value
      // for the context, TODO but only if the value is not `undefined`. Here
      // we're doing the thing where we use an object, so maybe we need to
      // rethink this...
      if (callbacks.length == 1 && typeof callbacks[0].vargs[1] == "object") {
        extend(stack[0].context, callbacks[0].vargs[1]);
      }

      // Filter out the return value, if there are callbacks left, then
      // `contextualize` will process them.
      callbacks = callbacks.filter(function (result) { return result.vargs[0] !== invoke });
      names = callbacks.length ? contextualize(step, callbacks, context) : [];

      // Give our creator a chance to inspect the step, possibly wrap it.
      Object.keys(options.wrap || {})
        .filter(function (name) { return named(step, name) && name })
        .map(function (name) { return options.wrap[name] })
        .forEach(function (wrapper) {
          var parameters = step.parameters, original = step.original || step;
          step = wrapper(step)
          step.parameters = parameters;
          step.original = original;
        });

      step.parameters.forEach(function (parameter) {
        // Did not know that `/^_|done$/` means `^_` or `done$`.
        if (/^(_|done)$/.test(parameter)) {
          arg = callback();
        } else if ((arg  = context[parameter]) == void(0)) {
          arg = methods[parameter];
        }
        args.push(arg);
      });

      cadences.length = 0;
      names.forEach(function (name) { if (name[0] == "$") delete context[name] });
      delete context.error;

      invocation = { callbacks: [], count: 0 , called: 0, context: context };
      invocation.arguments = [ steps, index + 1, context, invocation.callbacks, callback ]
      try {
        cadence()(null, invoke, step.apply(this, args));
      } catch (error) {
        thrown.apply(this, [ error ].concat(invocation.arguments));
        invoke();
      }
    }
  }
}

module.exports = factory;
