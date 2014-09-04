# Overriding and Extending the built-in values

`pockets` defines a `wrap` method, which let's you wrap a name lazily. This method is available on both `app` and `app.request`. For example, you would override the app value `cookieKeys` to enable signed cookies:

```javascript
var app = require('web-pockets')();
app.wrap('cookieKeys', function (cookieKeys) {
  return [
    'Oh so secret',
    'The secretest secret of them all',
    'Weißbier'
  ];
});
```

Note that while wrapper functions can depend on any other app values, they **must** depend on the name they are wrapping (even if they ignore it as above).

The original value is supplied as a promise-returning thunk, so you can control its evaluation. Here's an example of implementing request logging with `wrap`:

```javascript
app.request.wrap('result', function (request, result, logger) {
  var start = new Date();
  return result().then(
    function (result) {
      logger.success(request, result, new Date() - start);
      return result;
    }, 
    function (error) {
      logger.failure(request, result, new Date() - start, error);
      throw error;
    }
  );
});
```
