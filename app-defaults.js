var bops = require('bops');
var isStream = require('isa-stream').Readable;
var Promise = require('lie');
var STATUS_CODES = require('http').STATUS_CODES;
var wrapError = require('./wrap-error');

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
  console.error('Uncaught error:', error.stack);
  return responder(wrapError(error), response);
}

exports.cookieKeys = null;

function K (value) { return function () { return value; }; }
