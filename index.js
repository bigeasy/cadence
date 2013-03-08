"use strict";

var __slice = [].slice, EventEmitter = require('events').EventEmitter;

function die () {
  console.log.apply(console, __slice.call(arguments, 0));
  process.exit(1);
}

function say () { console.log.apply(console, __slice.call(arguments, 0)) }

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
      , methods = { step: async }
      , abended
      , key
      , arg
      , context = {}
      ;

    firstSteps = flatten(vargs);

    if (firstSteps.every(function (object) { return typeof object == "object" })) {
      return factory.apply(null, [ options ].concat(firstSteps));
    }

    firstSteps = firstSteps.map(function (step) { return parameterize(step, context) });

    return execute;

    function execute () {
      var vargs = __slice.call(arguments, 0), callbacks = [], callback = exceptional;
      if (vargs.length) {
        callback = vargs.pop();
        callbacks = [{ results: [{ names: [], vargs: vargs }] }];
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

    // Creating a problem for myself here. I'm using the named arguments, which
    // I was going to get rid of. Maybe I need to create a sub-cadence?
    function EventInterceptor (emitter) {
      var bindings = {}, gatherers = [], count = 0, completed = 0;
      this.on = function (type) {
        var callback = async(type);
        bindings[type] = { type: 'on', values: [] }
        emitter.on(type, function () {
          bindings[type].values.push(__slice.call(arguments, 0));
        });
        gatherers.push(function () {
          var values = bindings[type].values;
          if (values.every(function (value) { return value.length == 1 })) {
            values = values.map(function (value) { return value[0]  });
          }
          callback(null, values);
        });
        return this;
      }
      this.once = function (type) {
        var callback = async(type);
        bindings[type] = { type: 'once' }
        emitter.once(type, function () {
          callback.apply(null, [ null ].concat(arguments));
          if (++completed == count) {
            gatherers.forEach(function (gatherer) { gatherer() });
          }
        });
        count++;
        return this;
      }
      this.emitter = emitter;
    }

    // Set and reset a thirty second timeout between assertions.
    function timeout () {
      if (timer) clearTimeout(timer);
      if (options.timeout) timer = setTimeout(function () { callback(new Error("Timeout")) }, options.timeout);
    }

    var invocation;

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

      // If we're called with an empty array, we're going to assume that the
      // caller created a cadence programatically, but the conditions were such
      // that no steps were added to the cadence. If we don't skip the empty
      // array, then the next step will flatten the array and we'll end up
      // treating it as a call with no arguments, which generates a callback.

      //
      if (vargs.length == 1 && Array.isArray(vargs[0]) && !vargs[0].length)
        return;

      // If the first argument is null, we're going to assume this is an
      // explicit early return, otherwise we flatten the arguments.

      //
      if (false && vargs[0] != null)
        vargs = flatten(vargs);

      // Wrap event emitters with out interceptor.
      if (vargs[0] instanceof EventEmitter)
        return new EventInterceptor(vargs[0]);

      // The caller as invoked the async function directly as an explicit early
      // return to exit the entire cadence.
      if (vargs.length && (vargs[0] == null || vargs[0] instanceof Error)) {
        invocation.count = Number.MAX_VALUE;
        invocation.callback.apply(null, vargs);
        return;
      }

      // If we're called with a single object argument, we merge the given
      // object into the cadence context.
      if (vargs.length == 1 && typeof vargs[0] == "object" && vargs[0]) {
        extend(invocation.context, vargs[0]);
        return;
      }

      // If our first argument is a function, we check to see if it is a jump
      // instruction. If the function is a member of the current cadence, we
      // will inovke that function with the results of this step.

      // Search for the function in the current cadence.
      if (vargs.length == 1 && typeof vargs[0] == "function") {
        original = vargs[0].original || vargs[0];
        for (i = invocation.arguments[0].length - 1; step = invocation.arguments[0][i]; i--) {
          if (original === step || original === step.original) break;
        }
      }

      // If we find the function in the current cadence, we set the index of
      // next step function to execute; then remove the function argument and
      // procede.
      if (~i) {
        invocation.arguments[1] = i;
        vargs.shift();
      }

      // If we have no arguments, or else if every argument is a string, then
      // we've been asked to build a callback, otherwise, this is a sub-cadence.

      //
      if (vargs.length && vargs.every(function (arg) { return typeof arg == "function" })) {
        cadences.push(vargs);
      } else {
        if (!isNaN(parseFloat(vargs[0])) && isFinite(vargs[0])) {
          var arity = parseInt(vargs.shift(), 10);
        }
        if (Array.isArray(vargs[0]) && vargs[0].length == 0) {
          var arrayed = !! vargs.shift(); 
        }
        if (!arrayed) invocation.count++;
        if (vargs.length) throw new Error("invalid arguments");
        return createCallback(invocation, arity, arrayed);
      }
    }

    function createCallback (invocation, arity, arrayed) {
      var callback = { results: [] };
      if (arity) callback.arity = arity;
      if (arrayed) callback.arrayed = arrayed;
      invocation.callbacks.push(callback);
      return function (error) {
        var vargs = __slice.call(arguments, 1);
        if (error) {
          thrown(invocation, error);
        } else {
          callback.results.push({ names: [], vargs: vargs });
          // Indicates that the function has completed, so we need create
          // the callbacks for parallel cadences now, the next increment of
          // the called counter, which may be the last.
          if (vargs[0] == invoke) {
            cadences.slice(0).forEach(function (steps) {
              var subtext = Object.create(invocation.context);
              steps = steps.map(function (step) { return parameterize(step, subtext) });
              invoke(steps, 0, subtext, [], async());
            });
          }
        }
        if (!arrayed && ++invocation.called == invocation.count) {
          invoke.apply(null, invocation.arguments);
        }
      }
    }

    function parameterize (step, context) {
      var $ = /^function\s*[^(]*\(([^)]*)\)/.exec(step.toString());
      if (!$) throw new Error("bad function");
      if (step.name) {
        context[step.name] = function () { async(step).apply(null, [ null ].concat(__slice.call(arguments, 0))) }
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
      var $, names, name, value, index, vargs = [], arg, callback, arity;

      names = step.parameters.slice(0);
      if (~(index = names.indexOf('step')) || ~(index = names.indexOf(options.alias))) {
        names.length = index;
      }
      // **TODO**: Why? Do I care anymore? Why not callback?
      if (step.name == '_') {
        names.length = 0;
      }

      if (!names.length) return;

      arg = 0;
      while (callbacks.length) {
        callback = callbacks.shift();
        if (arity in callback) {
          arity = callback.arity;
        } else {
          arity = 0;
          callback.results.forEach(function (result) {
            arity = Math.max(arity, result.vargs.length);
          });
        }
        for (index = 0; index < arity; index++) {
          vargs.push({ values: [],
                       arrayed: ('arrayed' in callback) ? callback.arrayed : callback.results.length > 1 });
        }
        callback.results.forEach(function (result) {
          for (var i = 0; i < arity; i++) {
            vargs[arg + i].values.push(result.vargs[i]);
          }
        });
        arg += arity;
      }

      
      while (names.length) {
        name = names.shift();
        if ($ = /^\$vargs(?:\$(\d+))?$/.exec(name)) {
          ephemeral[name] = vargs.splice(0, vargs.length - (+($[1] || 0)))
                                 .map(function (varg) {
                                    return varg.arrayed ? varg.values : varg.values.shift()
                                 });
        } else {
          if (vargs.length) {
            value = vargs.shift();
            value = value.arrayed ? value.values : value.values.shift();
          } else {
            break;
          }
          (name[0] == '$' ? ephemeral : context)[name] = value;
        }
      }
    }

    // Attempt to organize many callbacks into parallel arrays of values.

    //
    function parallelize (names, callbacks, context, ephemeral) {
      if (callbacks.length == 1) {
        callbacks[0].names.forEach(function (name, i) {
          (names[i][0] == '$' ? ephemeral : context)[name] = callbacks[0].vargs[i];
        });
      } else {
        // Is the result well organized? We have a specific size for names.
        var arrayed = callbacks.every(function (result) {
          return (
            result.vargs.length == names.length
            && (!result.names.length || names.every(function (name, i) { return name == result.names[i] }))
          )
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

      invocation = { callbacks: [], count: 0 , called: 0, context: context,
                     index: index, callback: callback };
      invocation.arguments = [ steps, index + 1, context, invocation.callbacks, callback ]

      if (steps[index] && /^errors?$/.test(steps[index].parameters[0]) && !context.errors.length) {
        invoke(steps, index + 1, context, callbacks, callback);
      } else {
        // No callbacks means that we use the function return value, if any.
        if (callbacks.length == 1) {
          if (callbacks[0].results.length && callbacks[0].results[0].vargs[0] == invoke) {
            callbacks[0].results[0].vargs.shift()
          }
        } else {
          callbacks = callbacks.filter(function (callback) {
            return callback.results[0] && callback.results[0].vargs[0] !== invoke
          });
        }

        if (steps.length == index) {
          callback.apply(null, [ null ].concat(callbacks.length == 1 ? callbacks[0].results[0].vargs : []));
          return;
        }

        // Get the next step.
        step = steps[index];

        // Filter out the return value, if there are callbacks left, then
        // `contextualize` will process them.
        if (callbacks.length) {
          contextualize(step, callbacks, context, ephemeral);
        }

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
          if (parameter == options.alias) {
            parameter = 'step';
          }
          if (parameter == "error") {
            arg = context.errors[0];
          // Did not know that `/^_|callback$/` means `^_` or `done$`.
          } else if (/^(_|callback)$/.test(parameter)) {
            arg = async();
          } else if ((arg  = context[parameter]) == void(0)) {
            if ((arg = ephemeral[parameter]) == void(0)) arg = methods[parameter];
          }
          args.push(arg);
        });

        cadences.length = 0;
        context.errors = [];

        try {
          hold = async();
          result = step.apply(null, args);
          hold.apply(null, [ null, invoke ].concat(result == void(0) ? [] : [ result ]));
        } catch (error) {
          thrown(invocation, error);
          invoke.apply(null, invocation.arguments);
        }
      }
    }
  }
}

module.exports = factory();
