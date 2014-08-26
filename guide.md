# The `web-pockets` guide

## Introduction

`web-pockets` combines a [`pocket`][pockets] with an `http` request handler.  Like `pockets` itself, `web-pockets` is less of a "framework" than a tool for connecting loosely coupled components. This guide starts with examples where `web-pockets` does almost nothing for you, then builds up to a more framework-like experience by using the included defaults. 

### Aside: what is `pockets`?

If you're not yet familiar with `pockets`, here's a crash-course:

 1. Pockets contain values.
 2. Values are registered and retrieved by name. `pocket.get(name)` returns a promise for the named value.
 3. Pockets can be nested, and child pockets will retrieve missing values from their parents.
 4. Values are registered with `pocket.value(name, value)`.
 5. `value` can be a promise.
 6. If `typeof value === 'function'` then it will be used to lazily compute the actual value. For values that require async computation you can return a promise or [use node-style callbacks][node-style].
 7. Lazy value functions can depend on other values by using their names as parameter names. `pockets` takes care of resolving all dependencies. 
 8. [`pocket.run(someFn)`][pocket-run] will retrieve all the arguments named in `someFn`'s argument list (computing values and resolving promises as necessary) and then pass them to `someFn`. `pocket.run` returns a promise for `someFn`'s eventual result.

Make sense? Not really? Don't worry about it, the examples should clarify things.

[node-style]: https://github.com/grncdr/js-pockets#using-node-style-callback-functions
[pocket-run]: https://github.com/grncdr/js-pockets#getting-a-result-immediately

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

As mentioned previously, `app` is a handler function that takes `request` and `response` arguments. A simplified version of that handler would look like this:

```javascript
function handler (request, response) {
  var requestPocket = app.pocket();
  requestPocket.value('request', request);
  requestPocket.value('response', response);
  requestPocket.get('responder').then(requestPocket.run) // error handling elided
}
```

First the handler creates a child-pocket from `app`, then adds the `request` and `response` objects, finally it gets the `'responder'` for the pocket and runs it using `pocket.run`.

This `'responder'` is the only missing dependency, so let's define it:

```javascript
app.value('responder', function () {
  return function (response, config) {
    response.end(JSON.stringify(config));
  }
});
```

Because the responder will be run with `pocket.run`, it can depend on a `config` value we haven't defined yet. Let's add that to the app-wide pocket:

```javascript
var fs = require('lie-fs');
app.value('config', loadConfig);

function loadConfig () {
  return fs.readFile(__dirname + '/config.json').then(JSON.parse);
}
```

In a larger application you may want to define `loadConfig` in a separate module that you can test in isolation.

## Example 2 - Hit Counter

For this example, we're going to create a hit counter app that tracks how often each URL is visited.

First we implement the hit counter logic:

```javascript
function createHitCounter () {
  var hits = {};
  var counter = {
    inc: function increment (path) {
      hits[path] = 1 + counter.get(path);
      return hits[path];
    },
    get: function (path) {
      return hits[path] || 0;
    }
  }
  return counter;
}
```

Then we hook it up to the web:

```javascript
var app = createHandler();

app.value('hitCounter', createHitCounter);
app.value('responder', function (hitCounter) {
  return function (response, request) {
    var count = hitCounter.inc(request.url);
    response.end('Hits: ' + count + '\n');
  }
});
```

## The "Big Idea"

Organizing your application into a serial pipeline of actions to perform on each request/response pair (the `connect`/`express` middleware approach) is tedious and leads people to annoying anti-patterns like shoving everything into the `request` object.

`web-pockets` gently encourages modelling your application as a pure function. The inputs to this function can include any number of lazily computed values in addition to the `request` and `response` objects. The code to compute each lazy value can be simplified because `pockets` will sequence arbitrarily complex trees of asynchronous dependencies for you. Finally, `web-pockets` doesn't impose any particular interface or function signature on your code, so most of your application code doesn't need to be coupled to `pockets` at all. All of this adds up to a tool that rewards you (by removing boilerplate) for writing simple, loosely-coupled components.

## Example 3 - A bit more "framework" please

Ok, so maybe you're sitting there thinking _"That's great for architecture astronauts, but I need to Get Shit Done and these examples are pretty underwhelming"_. For you, `web-pockets` includes some helpful defaults, the first of which is a default `responder` that depends on a value named `result`. Using the default responder our previous example becomes:

```javascript
var app = createHandler();

app.value('hitCounter', createHitCounter);

app.requestValue('result', function (request, hitCounter) {
  return 'Hits: ' + hitCounter.inc(request.url) + '\n';
});
```

Notice that we're using `requestValue` above. This defines values that will be created fresh for each new request, if we just used `.value('result', ...)` then every request would get the same response.

The `result` you return can be a string, buffer, stream, or object, and the default responder will do the _Right Thing_:

 - If the result is a stream it will be piped into `response`
 - If it's a string or buffer the `Content-Length` header will be set before calling `response.end(result.body)`.
 - All other objects will be `JSON.stringify`ed, and both the `Content-Type` and `Content-Length` headers will be set.

To customize the status code or headers, return an object with the properties `statusCode`, `headers`, and `body`, (all optional) where `result.body` will be treated as above.

## Example 4 - What about routing?

Ok ok, in addition to the default `responder`, `web-pockets` also comes with a default provider for `result`. This provider matches the request method and URL against routes registered with `app.route`:

```javascript
var app = createHandler();

app.route('GET /*', function (match, hitCounter) {
  return hitCounter.get(match.splats[0])
});

app.route('PUT /*', function (match, hitCounter) {
  return hitCounter.inc(match.splats[0])
});
```

The route matching is provided by [`routes`][routes], and the resulting `match` object will be made available to the pocket that runs the route callback.

As seen above, routes patterns in `web-pockets` also include an HTTP verb. This can also be parameterized:

```javascript
handler.addRoute(':method /*', function (match) {
  return {
    statusCode: 404,
    body: "No route for: " + match.params.method + ' ' + match.splats[0]
  };
})
```

[routes]: https://github.com/aaronblohowiak/routes.js

## Example 5 - Augmenting defaults

You can augment the default implementations of `responder` and `result` by overriding them with a function that depends on `defaultResponder` and `defaultResult` respectively. This is useful for things you want to run globally like request logging:

```javascript
var app = createHandler();
app.value('responder', function () {
  return function (defaultResponder, request, response) {
    var start = new Date();
    var method = request.method;
    var url = request.url;
    response.on('finish', function  () {
      console.log(method, url, (new Date()) - start, 'ms');
    });
    return this.run(defaultResponder);
  }
});
```
