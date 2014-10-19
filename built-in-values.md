# Built-in default values

`web-pockets` includes a minimal set of default values for various names. These can [be overridden with `wrap`](overriding-and-extending.md) if you want to customize them for your application.

## "Global" app values

### `responder`

The default `responder` relies on the per-request `result`, rendering it as either plain-text, a binary stream, or JSON. See the docs for [`result`](#-result-) for more details on the different ways the result can be represented.

### `errorHandler`

The default `errorHandler` first tests if errors have a `toJSON` method, and if they do, calls the default responder with the result of `error.toJSON()`. This allows custom error constructors to entirely control their rendering.

For errors that don't define a `toJSON` method, the default error handler will inspect the error for a `statusCode` property, and render a standard plain-text error message. If the environment variable `DEBUG` is truthy, it will respond with the errors stack-trace.

This fallback error handling will also write stack-traces to the console, as it's expected that most applications will want to define their own error-handling by wrapping `result`.

### `cookieKeys`

This value is used to encrypt cookies using [`cookies`](https://npm.im/cookies). It's default value is `null` which means no encryption will be used.


## Per-request values

### `request`

The "raw" `IncomingMessage` from Node.

### `response`

The `ServerResponse` object from Node.

### `requestBody`

A buffer representing the complete request body. **Do not depend on this value if you need to process request bodies as a stream**, instead depend on `request`. Note that future versions of web-pockets may define a maximum body size as a per-request value.

### `parsedBody`

The result of calling `JSON.parse(requestBody)`.

### `result`

The normalized result of running the matched route handler in the per-request pocket. "normalized" means here that `result` will always be an object with the following properties:

 * `statusCode` - The HTTP status code for this response.
 * `headers` - A (possibly empty) object of response headers.
 * `body` - A string, buffer, or stream representing the data that will be sent back to client.

### `matchedRoute`

The result of [`router.match`](https://github.com/aaronblohowiak/routes.js#router-example).

### `parsedUrl`

The result of [`url.parse(request.url, true)`](http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost)

### `queryParams`

The `query` property of `parsedUrl`.

### `cookies`

Any cookies included with the request as parsed by [`cookies`](http://npm.im/cookies).
