"use strict";
var __slice = [].slice;

function extend (object) {
  __slice.call(arguments, 1).forEach(function (append) {
    for (var key in append) if (append.hasOwnProperty(key)) {
      object[key] = append[key];
    }
  });
  return object;
}

function factory () {
  var options = { context: {} };
  __slice.call(arguments, 0).forEach(function (opts) {
    var context = extend({}, options.context, opts.context || {});
    extend(options, opts).context = context;
  });

  return cadence;

  function cadence () {
    var vargs = __slice.call(arguments, 0)
      , steps = []
      , firstSteps = []
      , timer
      , callback
      , called
      , count
      , exitCode = 0
      , cadences = []
      , methods = { cadence: cadence }
      , abended
      , key
      , arg
      , context = {}
      ;

    firstSteps = flatten(vargs);

    if (firstSteps.every(function (object) { return typeof object == "object" })) {
      return factory.apply(this, [ options ].concat(firstSteps));
    }

    firstSteps = firstSteps.map(function (step) { return parameterize(step, context) });

    return execute;

    function execute () {
      var vargs = __slice.call(arguments, 0), callbacks = [], callback = exceptional;
      if (vargs.length) {
        callback = vargs.pop();
        callbacks = [{ names: [], vargs: vargs }];
      }
      steps = firstSteps.slice(0);
      cadences.length = 0;
      abended = false;
      invoke(steps, 0, Object.create(options.context), callbacks, callback);
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
      var vargs = __slice.call(arguments, 0), i = -1, step, original;
      if (vargs.length == 1 && Array.isArray(vargs[0]) && !vargs[0].length) return;
      //vargs = flatten(vargs);
      if (vargs.length && (vargs[0] == null || vargs[0] instanceof Error)) {
        invocation.count = Number.MAX_VALUE;
        invocation.callback.apply(this, vargs);
        return;
      }
      if (vargs.length == 1 && typeof vargs[0] == "object" && vargs[0]) {
        extend(invocation.context, vargs[0]);
        return;
      }
      if (vargs.length == 1 && typeof vargs[0] == "function") {
        original = vargs[0].original || vargs[0];
        for (i = invocation.arguments[0].length - 1; step = invocation.arguments[0][i]; i--) {
          if (original === step || original === step.original) break; 
        }
      }
      if (~i) {
        invocation.arguments[1] = i;
        vargs.shift();
      } 
      if (!vargs.length || vargs.every(function (arg) { return typeof vargs[0] == "string" })) {
        var names = vargs;
        invocation.count++;
        return (function (invocation) {
          return function (error) {
            var vargs = __slice.call(arguments, 1);
            if (error) {
              thrown(invocation, error);
            } else {
              invocation.callbacks.push({ names: names, vargs: vargs });
              // Indicates that the function has completed, so we need create
              // the callbacks for parallel cadences now, the next increment of
              // the called counter, which may be the last.
              if (vargs[0] == invoke) {
                cadences.slice(0).forEach(function (steps) {
                  var subtext = Object.create(invocation.context);
                  steps = steps.map(function (step) { return parameterize(step, subtext) });
                  invoke(steps, 0, subtext, [], cadence());
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

    function parameterize (step, context) {
      var $ = /^function\s*[^(]*\(([^)]*)\)/.exec(step.toString());
      if (!$) throw new Error("bad function");
      if (step.name) {
        context[step.name] = function () { cadence(step).apply(this, [ null ].concat(__slice.call(arguments, 0))) }
        context[step.name].original = step;
      }
      step.parameters = $[1].split(/\s*,\s/);
      if (!step.parameters[0].trim()) step.parameters.shift();
      return step;
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
    function thrown (invocation, error) {
      var steps = invocation.arguments[0]
        , next = steps[invocation.index + 1]
        ;
      if (next && /^errors?$/.test(next.parameters[0])) {
        invocation.context.errors.push(error);
      } else {
        if (timer) clearTimeout(timer);
        abended = true;
        invocation.callback(error);
      }
    }

    // Parallel arrays make the most sense, really. If the paralleled function
    // is better off returning a map, it can be shimmed.
    function contextualize (step, callbacks, context, ephemeral) {
      var inferred = !callbacks[0].names.length
        , names = (inferred ? step.parameters : callbacks[0].names).slice(0)
        , arrayed
        , i, $
        , vargs
        ;

      if (~(i = names.indexOf('cadence')) || ~(i = names.indexOf(options.alias))) {
        names.length = i;
      }
      if (callbacks.length == 1) {
        vargs = callbacks[0].vargs;
        for (i = names.length; i--;) {
          if (!names[i].indexOf('$vargs') && ($ = /^\$vargs(?:\$(\d+))?$/.exec(names[i]))) {
            ephemeral[names[i]] = vargs.splice(i, vargs.length - (i + +($[1] || 0)));
            names.splice(i, 1);
            break;
          }
        }
        names.length = callbacks[0].vargs.length;
        names.forEach(function (name, i) { (name[0] == '$' ? ephemeral : context)[name] = vargs[i] });
      } else if (names.length) {
        arrayed = callbacks.every(function (result) {
          return (
            result.vargs.length == names.length
            && ((inferred && !result.names.length)
                || names.every(function (name, i) { return name == result.names[i] }))
          );
        });
        if (arrayed) {
          names.length = callbacks[0].vargs.length;
          names.forEach(function (name, i) { (name[0] == '$' ? ephemeral : context)[name] = [] });
          callbacks.forEach(function (result) {
            result.vargs.forEach(function (arg, i) {
              (names[i][0] == '$' ? ephemeral : context)[names[i]].push(arg);
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
        , result
        , hold
        , ephemeral = {}
        ;
        

      if (abended) return;

      timeout();

      if (steps[index] && /^errors?$/.test(steps[index].parameters[0]) && !context.errors.length) {
        invoke(steps, index + 1, context, callbacks, callback);
      } else { 
        // No callbacks means that we use the function return value, if any. 
        if (callbacks.length == 1) {
          if (callbacks[0].vargs[0] == invoke) { callbacks[0].vargs.shift() }
        } else {
          callbacks = callbacks.filter(function (result) { return result.vargs[0] !== invoke });
        }

        if (steps.length == index) {
          callback.apply(this, [ null ].concat(callbacks.length == 1 ? callbacks[0].vargs : []));
          return;
        }

        // Get the next step.
        step = steps[index];

        // Filter out the return value, if there are callbacks left, then
        // `contextualize` will process them.
        names = callbacks.length ? contextualize(step, callbacks, context, ephemeral) : [];

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

        invocation = { callbacks: [], count: 0 , called: 0, context: context, index: index, callback: callback };
        invocation.arguments = [ steps, index + 1, context, invocation.callbacks, callback ]

        step.parameters.forEach(function (parameter) {
          if (parameter == options.alias) {
            parameter = 'cadence';
          }
          if (parameter == "error") {
            arg = context.errors[0];
          // Did not know that `/^_|callback$/` means `^_` or `done$`.
          } else if (/^(_|callback)$/.test(parameter)) {
            arg = cadence();
          } else if ((arg  = context[parameter]) == void(0)) {
            if ((arg = ephemeral[parameter]) == void(0)) arg = methods[parameter];
          }
          args.push(arg);
        });

        cadences.length = 0;
        names.forEach(function (name) { if (name[0] == "$") delete context[name] });
        context.errors = [];

        try {
          hold = cadence();
          result = step.apply(this, args);
          hold.apply(this, [ null, invoke ].concat(result == void(0) ? [] : [ result ]));
        } catch (error) {
          thrown(invocation, error);
          invoke.apply(this, invocation.arguments);
        }
      }
    }
  }
}

module.exports = factory;
