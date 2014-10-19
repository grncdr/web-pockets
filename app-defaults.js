var bops = require('bops');
var isStream = require('isa-stream').Readable;
var Promise = require('lie');
var STATUS_CODES = require('http').STATUS_CODES;

exports.responder = K(responder);
function responder (result, response) {
  var statusCode = result.statusCode || (result instanceof Error ? 500 : 200);
  var headers = result.headers || {};
  var body = result.body;

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
  if (error.toJSON) {
    // JSONify the error and respond with that data
    return responder(error.toJSON(), response);
  }
  else if (process.env.DEBUG) {
    body = error.stack + '\n';
  } else {
    body = STATUS_CODES[statusCode];
  }

  var contentType = 'text/plain';
  var statusCode = error.statusCode || 500;

  // error handler failed as well
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': body.length
  });
  response.end(body);
  console.error('Uncaught error:', error.stack);
}

exports.cookieKeys = null;

function K (value) { return function () { return value; }; }
