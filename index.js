var http = require('http');
var Routes = require('routes');
var pocket = require('pockets');
var appDefaults = require('./app-defaults');
var requestDefaults = require('./request-defaults');
var slice = Function.prototype.call.bind(Array.prototype.slice);
var testApp = require('./test').testApp;

var defaultErrorHandler = appDefaults.errorHandler();

module.exports = createHandler;

function createHandler (root) {
  var appPocket = root ? root.pocket() : pocket();

  for (var k in appDefaults) appPocket.value(k, appDefaults[k]);

  function handler (request, response) {
    request.pause();
    var rp = createRequestPocket(request, response);

    rp.get('responder').then(rp.run)
      .catch(function (responderError) {
        // This is called when user code wrapping 'result' fails.
        // The default 'result' provider will catch errors and transform them
        rp.value('error', responderError);

        return rp.get('errorHandler').then(function (errorHandler) {
          if (errorHandler === defaultErrorHandler) {
            return rp.run(errorHandler);
          } else {
            // chain the default error responder after user error responders
            return rp.run(errorHandler).catch(function (error) {
              console.error('User error responder threw while handling:',
                            responderError.stack);
              return defaultErrorHandler(error, response);
            });
          }
        });
      });
  }

  // Proxy all the pocket methods from the handler to the inner pocket
  for (var method in appPocket) {
    if (typeof appPocket[method] === 'function') {
      handler[method] = appPocket[method];
    }
  }

  handler.test = testApp.bind(null, handler);

  // a proxy that will save deferred calls to pocket methods, we apply these to
  // each request pocket on creation.
  handler.request = deferredProxy(appPocket);
  for (var k in requestDefaults) handler.request.value(k, requestDefaults[k]);

  var router = new Routes();
  handler.value('router', router);
  handler.route = function (pattern, fn) {
    router.addRoute(pattern, fn);
  };
  handler.routes = function (routes) {
    for (var route in routes) {
      handler.route(route, routes[route]);
    }
  };

  /**
   * Injects a fake request/response pair to verify that all dependencies have
   * providers. None of the values will actually be created.
   */
  handler.verify = function () {
    // fake a request, none of our value creation code will run, we just want to
    // make sure that all the names we depend on will be present.
    var child = createRequestPocket({}, {});
    var names = child.missingNames();

    if (names.length) {
      throw new TypeError(
        'Missing providers for ' +
        names.map(function (n) { return '"' + n + '"'; }).join(', ')
      );
    }
  };

  /**
   * Verifies dependencies, creates an HTTP server and
   * calls listen
   */
  handler.listen = function (port, host) {
    handler.verify();
    var server = http.createServer(handler);
    return server.listen(port, host);
  };


  handler.onError = function (errorHandler) {
    handler.value('errorHandler', function () {
      return errorHandler;
    });
  };

  return handler;

  function createRequestPocket (request, response) {
    var rp = appPocket.pocket().value('request', request).value('response', response);
    handler.request.apply(rp);
    return rp;
  }
}

function deferredProxy (proto) {
  var calls = [];
  var proxy = {};

  var methods = Object.keys(proto).filter(function (method) {
    return typeof proto[method] === 'function';
  });

  methods.forEach(function (method) {
    proxy[method] = function () {
      calls.push([method, arguments]);
      return this;
    };
  });

  proxy.apply = function (target) {
    for (var i = 0, len = calls.length; i < len; i++) {
      target[calls[i][0]].apply(target, calls[i][1]);
    }
  };

  return proxy;
}
