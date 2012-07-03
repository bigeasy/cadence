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
      , callback = vargs.pop()
      , steps = []
      , timer
      , callbacks = { results: {} }
      , exitCode = 0
      , cadences = []
      , methods = { cadence: cadence }
      , untidy
      , vargs
      , key
      , arg
      , context = extend({}, context)
      ;

    steps = flatten(vargs);
    
    if (steps.length == 0 && typeof callback == "object") {
      return factory(extend({}, options, callback));
    }

    steps = steps.map(function (step) { return parameterize(step) });

    invoke();

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
      if (!varg.length || (varg.length == 1 && typeof varg[0] == "string")) {
        var name = varg.shift();
        callbacks.count++;
        return function (error, result) {
          if (error) {
            thrown(error);
          } else if (name) {
            callbacks.results[name] || (callbacks.results[name] = []);
            callbacks.results[name].push(result);
          } else if (callbacks.count == 2 && result && typeof result == "object") {
            for (var key in result) context[key] = result[key];
          }
          if (++callbacks.called == callbacks.count) {
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
      } else {
        if (timer) clearTimeout(timer);
        callback(error);
      }
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
        ;

      timeout();

      while (cadences.length) {
        steps.unshift(cadences.pop());
      }

      if (!steps.length) {
        callback(null);
        return;
      }

      for (key in (callbacks.results || {})) {
        value = callbacks.results[key];
        context[key] = value && value.length == 1 ? value[0] : value;
      }

      step = steps.shift();

      Object.keys(options.wrappers || {})
        .filter(function (name) { return named(step, name) && name })
        .map(function (name) { return options.wrappers[name] })
        .forEach(function (wrapper) {
          var parameters = step.parameters;
          step = wrapper(step)
          step.parameters = parameters;
        });

      callbacks = { count: 0, called: 0, results: {} };
      for (i = 0, I = step.parameters.length; i < I; i++) {
        parameter = step.parameters[i];
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
      }
      delete context.error;
      next = cadence();
      try {
        result = step.apply(this, args);
        if (callbacks.count == 1) {
          if (typeof result == "object") {
            for (var key in result) if (result.hasOwnProperty(key)) context[key] = result[key];
          }
        }
        next(null);
      } catch (error) {
        thrown(error);
        invoke();
      }
    }
  }
}

module.exports = factory;
