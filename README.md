# web-pockets [![Build Status](https://travis-ci.org/grncdr/web-pockets.svg?branch=master)](https://travis-ci.org/grncdr/web-pockets)

Build loosely-coupled web-apps without caring about ordering.

## Synopsis

Create a handler function named `app`:

```javascript
var app = require('./')();
```

`app` is also a [pocket][pockets]:

```javascript
app.value('hits', createHitCounter);

function createHitCounter () {
  return new Promise(function (resolve) {
    // Pretend we did something more interesting here
    var hits = {};
    setTimeout(resolve, 1000, hits);
  });
}
```

You can also define values that are computed per-request:

```javascript
app.request.value('acceptsJson', requestAcceptsJSON);
function requestAcceptsJSON (request) {
  return /json/.test(request.headers.accept);
}
```

Use `app.route` to get going quickly:

```javascript
app.route('GET *', function (request, hits, acceptsJSON) {
  var count = hits[request.url] = (hits[request.url] || 0) + 1;
  if (acceptsJSON) {
    return { hits: count, url: request.url };
  }
  var message = request.url + ' has been visited ' + count + 'time';
  if (count !== 1) {
    message += 's';
  }
  return message;
});
```

## More Docs

 * The best place to start is [the guide](guide.md).
 * [Reference docs for all the built-in values](built-in-values.md).
 * For those wondering "why bother?": [Why `web-pockets` is better than other frameworks](why.md).

## More Examples

 * [An example of per-request values](https://github.com/grncdr/web-pockets/tree/master/examples/per-request-values) lives in this repo.
 * [feedr](https://github.com/sdepold/feedr) is a server that retrieves and normalizes RSS feeds.

## API

```ocaml
Handler = Pocket & ((Request, Response) => void) & {
  request: PocketProxy
}

module.exports =: (Pocket?) => Handler
```

The default export takes an optional "root" pocket and returns a handler function that is also a pocket. The handler function has a property named `request` that is a _deferred proxy_ for the child pocket implicitly created for each request. What this means is that values that should be computed once for the entire app are defined on the handler using e.g. `app.value(name, valOrFunction)`, and values that should be computed once per-request are defined using `app.request.value(name, valOrFunction)`.

See also: [API docs for `Pocket`][pockets-api]

## License

MIT

[pockets]: https://github.com/grncdr/js-pockets
[pockets-api]: https://github.com/grncdr/js-pockets/blob/master/API.md
