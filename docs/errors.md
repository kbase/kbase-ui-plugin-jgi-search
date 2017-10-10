# Errors and Handling Them

Principles

All errors possess the following fields:

- message
- type
- code

Optionally

- info

An info field may contain data specific to the type and code of a message.

In the context of application which is generating errors, the type represents the category of error, and the code the specific error within that context. For further narrowing down of the reason for the error, subject of an error, etc., the info field shall be used.

The error information should strive to be specific enough that the caller can provide information to the end user or developer to address the problem.

In cases in which the amount of information might be overwhelming in terms of size or diversity, the error reporter must deal with it. For instance, there may be dozens of possible http response codes, but specific ones are relevant to the context, or they can be grouped, with specific error messages, and the rest can be provided in an "other" error message with enough info to be useful for advanced diagnostics. On the other hand, a stack trace may be overwhelmingly long -- the error reporter should provide a short message and include the trace in the info, not provide a very long message.

An application layer which consumes an error may "wrap" the error in order to make it more contextually relevant to the end user. In such cases, the "wrap" property shall be used to record the previous error. The wrap property therefore represents a stack of previous errors, with the most recent wrapped error first.

In some cases an error is reported through an exception mechanism and not an error structure. There may be many exceptions to catch. Only relevant or interesting exceptions need be specifically handled, the rest may be reported simply as an exception, with the message, and the stack trace in the info.

Stack traces should be reported as a list of strings, not a very long string with line breaks.

## Types of errors

domain
  type
    code
        info

upstream-service
  network
    connection-timeout
      timeout
    host-not-found
      host
    other
      message
  http-error
    internal-error (500)
      body
    service-unavailable (503)
    proxy-error (502)
    client-error (400)
      data
    not-found (404)
    other
      status
dynamic-service
  bad-method
    method
  input
    missing
      key
    wrong-type
      key
      expected
      received
    invalid
      key
      description
      other info
  config-missing
    key
  config-invalid
    key
    description
    other info
  exception
    message
    stacktrace
client
  exception
    message
    stacktrace



dynamic-service
  network
  http-error
  service-error

client
