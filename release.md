### Array Returns as Arguments

Now when an array is returned using `return` the elements of the array are used
as the arguments to the subsequent step. If you want to return multiple values
to be passed as multiple arguments to the subsequent step, return them as an
array.

So, now if you want actually want to return an array to be used as the sole
argument to the subsequent step, you need to put that array in an array to be
explicit. When in doubt, wrap it up in an array.

### Issue by Issue

 * Implement promise handlers. #190.
 * Undefined return and no callbacks means skip. #189.
 * Use the elements of a returned array as arguments to subsequent step. #188.
