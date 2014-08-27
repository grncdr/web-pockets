var http = require('http');
var Routes = require('routes');
var pocket = require('pockets');
var appDefaults = require('./app-defaults');
var requestDefaults = require('./request-defaults');
var slice = Function.prototype.call.bind(Array.prototype.slice);

module.exports = createHandler;

function createHandler (root) {
  var appPocket = root ? root.pocket() : pocket();
  addDefaults(appPocket, appDefaults);

  var perRequestValues = [];

  function handler (request, response) {

    var rp = createRequestPocket(request, response);

    rp.get('responder').then(rp.run)
      .catch(function (err) {
        rp.value('error', err);
        return rp.get('errorHandler').then(rp.run);
      })
      .catch(function (err) {
        return defaults.errorHandler(err, response);
      });
  }

  // Proxy all the pocket methods from the handler to the inner pocket
  Object.keys(appPocket).filter(function (k) {
    return typeof appPocket[k] === 'function';
  }).forEach(function (method) {
    handler[method] = function () {
      appPocket[method].apply(appPocket, arguments);
      return handler;
    };
  });

  // save a deferred call to requestPocket.value
  handler.requestValue = function () {
    perRequestValues.push(slice(arguments));
    return handler;
  };

  var router = new Routes();
  handler.value('router', router);
  handler.route = router.addRoute.bind(router);

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
    var rp = appPocket.pocket();
    perRequestValues.forEach(function (args) {
      rp.value.apply(rp, args);
    });
    rp.value('request', request)
      .value('response', response);

    addDefaults(rp, requestDefaults);
    return rp;
  }
}

function addDefaults (pocket, defaults) {
  for (var k in defaults) {
    // add the default
    pocket.default(k, defaults[k]);
    // store each defaults with a prefix so they can be used by overrides
    pocket.default('default' + k, defaults[k]);
  }
}
