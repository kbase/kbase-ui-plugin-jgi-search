# Errors and Handling Them

We need a uniform error structure which is suitable for presenting useful information to a user, adequate technical information for diagnosis, and automated logging of errors.

Utility for the user implies several things:

- an intelligible error message
- tie the error message and other error information as closely to the current context as possible
- present possible solutions for the user
- provide avenues for the user to explore the nature of the error, or of the tool itself
- if all else fails, provide a way for the user to engage with kbase support

Stretches:
- provide a list of recent errors of the same type
- provide a list of user issues which may be related

Although we cannot necessarily achieve all of these goals to a satisfactory level with this project, we can lay the groundwork.


## Error Information

- source: which component reported the error
- code: an error code unique to the source
- message: a short meaningful description of the error, contextually meaningful
- detail: a longer prose description of the error
- info: a structure containing meaningful data or metadata associated with the error
- wrapped: an array containing a stack of error contexts.


### source and code

The source and code together allow us to precisely pinpoint the location in the ui code or service which detected the condition and generated the error message. The usage of "source" services to namespace the code. Since error codes should be unique, it is much easier to ensure uniqueness of we provide namespacing at the onset. The source naturally falls along code modularity - service repo, library repo, ui plugin, etc.

The structure of the code is arbtrary. It may be a string or a number. Strings have the advantage of being easier for the analyst to grok, but they can be difficult to make unique in a large codebase. Numeric codes have the advantage of being shorter and consise, but are not as easy for analysts to remember.

### message

The error message is the most ubuiquitous representation of an error. In many programming languages it may be the *only* representation.

It should be immediately meaningful to the user. It should not merely reflect the underlying technical error, but must be in a form which the user can interpret in the ui context in which they are engaged. This implies that the message may not be merely copied from the underlying code or service error. It may wrap that error, e.g. by prefixing the original message with a brief explanation. However, it is often better to simply provide a short, concise, meaningful message, and leave additional information for the "detail" or "info" fields.

### detail

Given the usage of "message" to convey a brief text description of the error, the detail section should expand that message with more prose describing the nature of the error. It should not be very long, but can elaborate on possible causes and resolutions.

### info

Most errors are related to very specific actions, data elements, services and method calls, etc. While these may be communicated in the message and detail, given the need for precision at times, the info field should be used to carry any information needed to pinpoint the error in the given ui context.

The info field is typically hidden by default, but may be revealed by the user. It may also be used by ui display elements to provide structural assistance, and for error logging to provide debugging information. E.g. info may include the stacktrace, or the module and function which reported the error.

### wrapped

The wrapped field is a stack of error contexts, starting at the original detection of error and ending at the ui component repsonsible for creating the proper error structure, handling the display, and logging the error.

This property allows the capture of all significant locations in which the error is detected but not directly handled. Often the detection of an error is in an underlying library or utility which has not way of representing a contextually meaningful message or detail. In such cases the error is propagated "up" the application stack until it is handled for good. At each level of the app stack, additional context may be added ...

Hmm, what about the location? Where should that point?


## Principles

- uniform error structure
- precisely identify the location of the error
- provide solutions for the user
- provide references for the user
- log (report) all errors
- 


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
