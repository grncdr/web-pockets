# The `web-pockets` guide

## Introduction

`web-pockets` combines a [`pocket`][pockets] with an `http` request handler.  Like `pockets` itself, `web-pockets` is less of a "framework" than a tool for connecting loosely coupled components.

Don't worry if you're not yet familiar with `pockets`, the examples will show you all you need to know.

## Example 1 - Hello world

Create a new `web-pockets` app like so:

```javascript
var createHandler = require('web-pockets');
var app = createHandler();
```

The `app` we've just created is a function that we can pass to `http.createServer`:

```javascript
var http = require('http');
var server = http.createServer(app);
```

You can also call `app.listen(port, interface)` to have an http server created for you. Now that we have an app, let's add a route:

```javascript
app.route('GET /hello', function () { return 'Hello, world'; });
```

This is actually short-hand for returning an object like `{ body: 'Hello, world' }`. Returning an object is how you define custom headers or status codes:

```javascript
app.route('GET /hello-header', function () {
  return {
    status: 204,
    headers: { 'x-greeting': 'Hello, world' }
    body: '',
  }
});
```

The `body` property can be a string, buffer, stream, or object, and `web-pockets` will do the _Right Thing_:

 - If the result is a stream it will be piped into `response`
 - If it's a string or buffer the `Content-Length` header will be set before calling `response.end(result.body)`.
 - All other objects will be `JSON.stringify`ed, and both the `Content-Type` and `Content-Length` headers will be set.

## Example 2 - Per-app values

For this example, we're going to create a simple counter API that uses the request URL as the counter name.

First we implement the counter logic:

```javascript
function createCounter () {
  var hits = {};
  var counter = {
    inc: function increment (key) {
      hits[key] = 1 + counter.get(key);
      return hits[key];
    },
    get: function show (key) {
      return hits[key] || 0;
    }
  }
  return counter;
}
```

We connect this constructor function to an app using `app.value`:

```javascript
var app = createHandler();
app.value('hitCounter', createCounter);
```

This defines the name `hitCounter` as a lazy value. The first time a `hitCounter` is needed, `createCounter` will be called. That same counter will be returned every time a `hitCounter` is requested from then on. In order to use a `hitCounter` in a route, we simply add it as a paremeter to our route handler:

```javascript
app.route('POST /*', function (request, hitCounter) {
  return { body: { hits: hitCounter.inc(request.url) } };
})

app.route('GET /*', function (request, hitCounter) {
  return { body: { hits: hitCounter.get(request.url) } };
});
```

Now every `POST` request will increment and return the counter for that URL, while every `GET` request will just return the count. `web-pockets` will take care of `JSON.stringify`ing the body and adding the appropriate Content-Type and Content-Length headers to the response.

Things don't get much more complicated if our hit counter talks to a database somewhere and returns a promise:

```javascript
app.route('POST /*', function (request, hitCounter) {
  return hitCounter.inc(request.url).then(hitsResult);
})

app.route('GET /*', function (request, hitCounter) {
  return hitCounter.get(request.url).then(hitsResult);
});

function hitsResult (hits) {
  return { body: { hits: hits } };
}
```

### Pockets resolve (asynchronous) dependencies

App-values can depend on other app values just like route handlers do: by using their names as parameters. They can also be computed asynchronously by returning a promise:

```javascript
app.value('config', function (configUrl) {
  return questor(configUrl).then(JSON.parse);
});

app.value('configUrl', 'http://config.internal/' + process.env.NODE_ENV + '.json');
```

Above, the request to `configUrl` will only ever be made once. We can also define asyncrhonous values using callbacks with `nodeValue`:

```javascript
app.nodeValue('database', function (config, callback) {
  createDatabaseClient(config.database, callback);
});
```

Our route handlers can still just depend on `database`:

```javascript
app.route('/things', function (database) {
  return database.query('select * from things').pipe(JSONStream());
});
```

## Example 3 - Route parameters

Route matching is provided by [`routes`][routes], and will define a `match` value you can use in route handler functions.

```javascript
var app = createHandler();
app.value('translations', require('./examples/per-request-values/translations'));

app.route('GET /greeting/:language', function (match, greetings) {
  if (!translations[match.params.language]) {
    return { statusCode: 404, body: 'Unknown language' };
  }
  return translations[match.params.language].hello;
});
```

### Aside: verbs in routes 

As you may have noticed, routes patterns in `web-pockets` include an HTTP verb. This can also be parameterized: `app.route(':method /*', function (match) { ... })`

## Example 4 - Per-request values

What if we wanted to use our greeting in other route handlers? Let's add a second handler that returns a greeting and the current time:

```javascript
var app = createHandler();
app.value('translations', require('./examples/per-request-values/translations'));

app.route('GET /greeting/:language', function (match, translations) {
  if (!translations[match.params.language]) {
    return { statusCode: 404, body: 'Unknown language' };
  }
  return translations[match.params.language].hello;
});

app.route('GET /time/:language', function (match, translations) {
  if (!translations[match.params.language]) {
    return { statusCode: 404, body: 'Unknown language' };
  }
  var greeting = translations[match.params.language].hello;
  var timeFormatString = translations[match.params.language].theTime;
  var time = timeFormatString.replace('{time}', new Date());
  return greeting + '. ' + time + '.';
});
```

While this works (modulo time localization), there's quite a bit of noise and outright duplication (validating the language parameter). What we want to do is have shared values like `app.value`, but on a per-request basis. Luckily, this is exactly what `app.request.value` is for:

```javascript
var app = createHandler();
app.value('translations', require('./examples/per-request-values/translations'));

app.request.value('messages', function (match, translations) {
  if (!translations[match.params.language]) {
    var err = new Error('Unknown language');
    err.statusCode = 404;
    throw err;
  }
  return translations[match.params.language];
});

app.route('GET /greeting/:language', function (messages) {
  return messages.hello;
});

app.route('GET /time/:language', function (messages) {
  return messages.theTime.replace('{time}', new Date());
});
```

Now our route handlers don't even need to know about the language parameter; we could pull it out of a header, cookie, user-session or whatever and our route handlers never change: **that** is separation of concerns!

This app is also implemented in [`examples/per-request-values`](examples/per-request-values), where each value is defined in it's own module. Using consistent naming make's it easy to find things, and it's clear that each of the modules can be tested in isolation with very little effort.

## The "Big Idea"

Organizing your application into a serial pipeline of actions to perform on each request/response pair (the `connect`/`express` middleware approach) is tedious. You need to manage dependencies between middleware manually and there's no obvious place to store request specific data except the `request` object itself. This leads to annoying anti-patterns such as monkey-patching `request.end`, and can make it non-obvious where a given property of `request` was actually created.

Instead, `web-pockets` gently encourages modelling your application as a pure function. The inputs to this function can include any number of lazily computed values in addition to the `request` and `response` objects. The code to compute each lazy value can be simplified because `pockets` will sequence arbitrarily complex trees of asynchronous dependencies for you. Finally, `web-pockets` doesn't impose any particular interface or function signature on your code, so most of your application code doesn't need to be coupled to `pockets` at all. All of this adds up to a tool that rewards you (by removing boilerplate) for writing simple, loosely-coupled components.

And that's it, you're now set to go forth and `web-pocket`! You may want to peruse the [Pockets API docs][pockets-api], and the (as-yet undocumented) [built-in per-request values](request-defaults.js). This is a young project so we are very open to feedback on the appropriate behaviour of built-in values, or if you just want to override them, see [Overriding and Wrapping](overriding-and-extending.md).

[pockets]: https://github.com/grncdr/js-pockets
[pockets-api]: https://github.com/grncdr/js-pockets/blob/master/API.md
[routes]: https://github.com/aaronblohowiak/routes.js
