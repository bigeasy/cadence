"use strict";
var count = 0;

var name = 0;

function invoke (func) { return func() }

function foo (step) {
  var wrapped, name = "__cadence__" + (++count);
  eval("(function () { function " + name + " () { invoke(" + step + ") }; wrapped = " + name + "})();");
  return wrapped;
}

foo(function () { a () })();

function a () {
  if (count++ < 1) a();
  else console.log(new Error().stack)
}
