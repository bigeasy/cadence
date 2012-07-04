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
      callbacks = [ { names: [], vargs: [] } ];
      cadences.length = 0;
      abended = false;
      invoke();
    }

    function exceptional (error) { throw error }

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

    function cadence () {
      var varg = __slice.call(arguments, 0);
      if (varg.length == 1 && Array.isArray(varg[0]) && !varg[0].length) return;
      varg = flatten(varg);
      if (!varg.length || varg.every(function (arg) { return typeof varg[0] == "string" })) {
        var names = varg, key;
        count++;
        return function (error) {
          var vargs = __slice.call(arguments, 1);
          if (error) {
            thrown(error);
          } else {
            callbacks.push({ names: names, vargs: vargs });
          }
          if (++called == count) {
            invoke();
          }
        }
      } else while (varg.length) {
        cadences.push(parameterize(varg.shift()));
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

    function thrown (error) {
      if (steps.length && steps.length && ~steps[0].parameters.indexOf("error")) {
        context.error = error;
      }
      abended = true;
      if (timer) clearTimeout(timer);
      callback(error);
    }

    // Parallel arrays make the most sense, really. If the paralleled function
    // is better off returning a map, it can be shimmed.
    function contextualize (step) {
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

    function invoke () {
      var arg
        , args = []
        , done = false
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

      while (cadences.length) {
        steps.unshift(cadences.pop());
      }

      if (!steps.length) {
        callback(null);
        return;
      }

      callbacks = callbacks.filter(function (result) { return result.vargs[0] !== cadence });

      step = steps.shift();

      names = callbacks.length ? contextualize(step) : [];

      Object.keys(options.wrappers || {})
        .filter(function (name) { return named(step, name) && name })
        .map(function (name) { return options.wrappers[name] })
        .forEach(function (wrapper) {
          var parameters = step.parameters;
          step = wrapper(step)
          step.parameters = parameters;
        });

      step.parameters.forEach(function (parameter) {
        // Did not know that `/^_|done$/` means `^_` or `done$`.
        done = /^(_|done)$/.test(parameter);
        if (done) {
          arg = callback();
        } else {
          arg = context[parameter];
          if (arg == null) {
            arg = methods[parameter];
          }
        }
        args.push(arg);
      });
      delete context.error;
      names.forEach(function (name) { if (name[0] == "$") delete context[name] });
      callbacks = [];
      count = called = 0;
      next = cadence();
      try {
        result = step.apply(this, args);
        if (count == 1) {
          if (typeof result == "object") {
            for (var key in result) if (result.hasOwnProperty(key)) context[key] = result[key];
          }
        }
        next(null, cadence);
      } catch (error) {
        thrown(error)
        invoke();
      }
    }
  }
}

module.exports = factory;
