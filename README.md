# web-pockets

Build loosely-coupled web-apps without caring about ordering.

## Synopsis

_(There is also a [more thorough guide](guide.md), and an an explanation [why `web-pockets` is better than other frameworks](why.md).)_

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

You can define values that are computed per-request:

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

[pockets-api]: https://github.com/grncdr/js-pockets/blob/master/API.md
