'use strict';
var STATUS_CODES = require('http').STATUS_CODES;

/**
 * Shared logic for wrapping error instances into results. This code is used by
 * the default provider for 'result' and the default/fallback errorHandler
 */
module.exports = function transformError (error) {
  // delegate to the error if it can turn itself into an object
  if (error.toJSON) {
    return error.toJSON();
  }

  var statusCode = error.statusCode || 500;
  var body = error.body || (
    (process.env.DEBUG ? error.stack : STATUS_CODES[statusCode]) + '\n'
  );
  var headers = error.headers || {
    'Content-Type': 'text/plain',
    'Content-Length': body.length
  };

  return {
    statusCode: statusCode,
    headers: headers,
    body: body,
    error: error
  };
};
