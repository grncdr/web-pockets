var bops = require('bops');
var Promise = require('lie');
var STATUS_CODES = require('http').STATUS_CODES;
var collectStream = require('lie-denodify')(require('collect-stream'));

exports.responder = K(responder);
function responder (result, response) {
  if (result === null || result === void(0)) {
    result = { statusCode: 404, body: 'Not Found' };
  }

  if (typeof result !== 'object' ||
      bops.is(result) ||
      isStream(result) ||
      !result.hasOwnProperty('body')) {
    result = { body: result };
  }

  var statusCode = result.statusCode || (result instanceof Error ? 500 : 200);
  var headers = result.headers || {};
  var body = result.body;

  if (isStream(body)) {
    if (!headers['content-type']) {
      headers['content-type'] = 'application/octet-stream';
    }
    if (body.length) {
      headers['conent-length'] = body.length
    }
    response.writeHead(statusCode, headers);
    body.pipe(response);
  }

  else {
    if (typeof body === 'string') {
      body = bops.from(body);
    } else if (!bops.is(body)) {
      body = bops.from(JSON.stringify(body));
      headers['content-type'] = 'application/json';
    }
    if (!headers['content-type']) {
      headers['content-type'] = 'text/plain';
    }
    headers['content-length'] = body.length;
    response.writeHead(statusCode, headers);
    response.end(body);
  }
  return new Promise(function (pass, fail) {
    response.on('end', pass).on('error', fail);
  });
}

exports.errorHandler = K(errorHandler);
function errorHandler (error, response) {
  var body;
  var contentType = 'text/plain';
  var statusCode = error.statusCode || 500;
  if (error.toJSON) {
    // JSONify the error and respond with that data
    return responder(error.toJSON(), response);
  }
  else if (process.env.DEBUG) {
    body = error.stack + '\n';
  } else {
    body = STATUS_CODES[statusCode];
  }
  // error handler failed as well
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': body.length
  });
  response.end(body);
  console.error('Uncaught error:', error.stack);
}

exports.requestBody = function (request) {
  return collectStream(request);
};

exports.result = getResult;
function getResult (matchedRoute) {
  var requestPocket = this;

  return (function tryNextMatch (match) {
    if (!match) {
      return { statusCode: 404, body: 'Not Found' };
    }
    var matchPocket = requestPocket.pocket();
    matchPocket.value('match', match);
    return matchPocket.run(match.fn).then(function (result) {
      // try next match if nothing was returned.
      return result || tryNextMatch(match.next());
    });
  })(matchedRoute);
}

exports.matchedRoute = getMatchedRoute;
function getMatchedRoute (router, request) {
  return router.match(request.method + ' ' + request.url) || false;
}

function isStream (thing) {
  return thing && typeof thing.pipe === 'function';
}

function K (value) { return function () { return value; }; }
