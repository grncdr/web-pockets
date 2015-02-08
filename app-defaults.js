var bops = require('bops');
var isStream = require('isa-stream').Readable;
var Lie = typeof Promise === 'undefined' ? require('lie') : Promise;
var wrapError = require('./wrap-error');

exports.$responder = k(responder);
function responder ($result, $response) {
  var statusCode = $result.statusCode || ($result instanceof Error ? 500 : 200);
  var headers = $result.headers || {};
  var body = $result.body;

  if (isStream(body)) {
    if (!headers['content-type']) {
      headers['content-type'] = 'application/octet-stream';
    }
    if (body.length) {
      headers['conent-length'] = body.length;
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
    $response.writeHead(statusCode, headers);
    $response.end(body);
  }

  return new Lie(function (pass, fail) {
    $response.on('end', pass).on('error', fail);
  });
}

exports.$errorHandler = k(errorHandler);
function errorHandler ($error, $response) {
  console.error('Uncaught error:', $error.stack);
  return responder(wrapError($error), $response);
}

exports.$cookieKeys = null;

function k (value) { return function () { return value; }; }
