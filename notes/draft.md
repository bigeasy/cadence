

Finalizers are always run when a function exists, even when the function exists
early because of an error or an exception. They are used to clean up after the
function, releasing resources.


Finalizers are possible because of the asynchronous stack.

Terminating the stack.

An example of how control flow leaves the application, .

No, use an `etcd` example, from `reconfigure`, which is perfect.


```
var dirs = cadence(function (async) {
})

var starter = cadence(function (async) {
    server.on('request', function (request, response) {
        dir(request.url, request, response, function (error) {
            if (error) {
                // what do I do with it?
            }
        }}
    })
})
```
