Considering whether or not to have Cadence return immediately after an error.

Part of "turning the corner," starting a stack off the I/O event queue is so
that an exception will not be caught by some clever error handler, like Cadence.

Cadence like control flow, or ad hoc control flow, that tries to catch
exceptions will make the mistake of catching an exception that is meant to unwind
the stack. I've used `setImmediate` to ensure that `abend` will cause an
exception to entirely unwind.

Now I'm playing around with determinism, which requires synchronicity. When I'm
replaying log entries, it is important that the responses are synchronous for
each log entry. (Is it? Can't I just replay the log entries in an async loop?)

Should I get rid of the reliance on `setImmediate`? Should I profile the use of
`nextTick`?
