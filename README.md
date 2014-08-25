# web-pockets

Build loosely-coupled web-apps without caring about ordering.

## Synopsis

_(For a more thorough explanation, see [the guide][guide.md])_

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
app.requestValue('acceptsJson', requestAcceptsJSON);
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
  requestValue: (Object) => Handler
  requestValue: (String, Any) => Handler
}

module.exports =: (Pocket?) => Handler
```

The default export takes an optional "root" pocket and returns a handler function that is also a pocket. Values that you put into the pocket using `.value` are shared across requests, while values added with `.requestValue` will be lazily computed for each request. 

See also: [API docs for `Pocket`][pockets]

## License

MIT
