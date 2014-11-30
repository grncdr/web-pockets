# Overriding and Extending the built-in values

`pockets` defines a `wrap` method, which let's you wrap a name lazily. This method is available on both `app` and `app.request`. For example, you would override the app value `cookieKeys` to enable signed cookies:

```javascript
var app = require('web-pockets')();
app.wrap('cookieKeys', function () {
  return [
    'Oh so secret',
    'The secretest secret of them all',
    'Weißbier'
  ];
});
```

Depending on the name you are wrapping supplies it as a promise-returning thunk, so you can control its evaluation. Here's an example of implementing request logging with `wrap`:

```javascript
app.request.wrap('result', function (request, result, logger) {
  var start = new Date();
  return result().then(
    function (result) {
      logger.success(request, result, new Date() - start);
      return result;
    }, 
    function (error) {
      logger.failure(request, error, new Date() - start);
      throw error;
    }
  );
});
```
