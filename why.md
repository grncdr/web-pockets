# What's wrong with the status quo?

`web-pockets` attempts to address the following issues with express, hapi, restify, etc. etc.

 - [Middleware doesn't compose](#middleware-doesn-t-compose).
 - [Extending the framework is awkward](#extending-the-framework-is-awkward).

If you don't care about my opinions on these subjects, you might prefer the [guide](guide.md) instead.

## Middleware doesn't compose

This might seem counter-intuitive, but the middleware style used by Express (and Restify and even Koa) does not compose cleanly. This is mostly due to the artificial limitations imposed by the static `(request, response, next)` function signature. In particular, the only way middlewares in a stack can cooperate is to attach extra data to `request` (or `response` but that's not as common) before passing it on down the stack.

Consider the concrete example of needing to lookup user sessions. In Express, we might have something like this:

```javascript
var app = require('express')();
var sessionStore = require('./session-store');
app.use(cookieParser());
app.use(loadSessionMiddleware(sessionStore));
app.get('/', function (req, res) {
  if (req.session) {
    res.end("Hello " + req.session.name);
  } else {
    res.end("I don't know you");
  }
});
```

We assume that the "loadSession" middleware will attach a `session` property to the request. But what's "cookieParser" doing in there? We can _guess_ that it's necessary so we can load the session data based on a special cookie value, so we need to make sure it's always included before `loadSession`. All of our middleware essentially share 1 global bag of variables (`request`), and need to be called in the right order for things to work. Doesn't sound very composable to me.

This implicit coupling makes not only the "high-level" organization of an app unnecessarily difficult to understand, it also complicates the individual pieces of application logic. For example, here's a _minimal_ implementation of "loadSession":

```javascript
function loadSessionMiddleware (store) {
  return function (req, res, next) {
    if (!req.cookies._SID) return;
    store.get(req.cookies._SID, function (err, session) {
      if (err) return next(err);
      req.session = session;
      next();
    });
  };
}
```

In 9 lines of code, exactly 1 is actually loading the session. The rest of it is boilerplate to make our straightforward `store.get` call fit the signature of `(req, res, next)`. In this specific scenario somebody has probably written the boilerplate and published it to the npm registry for you to re-use, but it's still pointless code.

Here's the same example with `web-pockets`:

```javascript
var app = require('web-pockets')();
app.value('sessionStore', require('./session-store'));
app.requestValue('cookies', parseCookies);
app.requestValue('session', loadSession);

function loadSession (sessionStore, cookies) {
  return cookies._SID && sessionStore.get(cookies._SID);
}

app.route('GET /', function (session) {
  return session ? "Hello " + session.name : "I don't know you";
});
```

Not only is the entire app 1 SLOC more than the `loadSession` middleware alone, the ordering of the calls to `app.value` and `app.requestValue` is irrelevant and we aren't stuttering "request-dot" before every variable name.

## Extending the framework is awkward

Beyond middleware (and their limited `(req, res, next)` signature), the extension points available to you as a framework user vary widely. Express has the ability to mount sub apps and [`app.param`](http://expressjs.com/api#app.param) with it's even more awkward API of `(req, res, next, parameter)` and that's about it.

On the other side of the spectrum are frameworks like Hapi, with elaborate (and over-engineered IMO) plugin APIs. Inevitably your needs will not quite mesh with the plugin interfaces exposed to you, and you end up writing more code to make a square peg fit a round hole.

`web-pockets` addresses this by _being a service, not a framework_. The service it provides is ordering interdependant asynchronous operations, so you don't have to. On top of this service are included some _defaults_, but it is trivial to opt out of these or augment them using plain-old function composition.

<a name="footnotes"></a>
\* The defaults are **not** final. The question of how to best decompose them is very much open.

[1]: #footnotes
[pockets]: https://github.com/grncdr/js-pockets


