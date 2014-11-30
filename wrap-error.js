'use strict';
var STATUS_CODES = require('http').STATUS_CODES;

/**
 * Shared logic for wrapping error instances into results. This code is used by
 * the default provider for 'result' and the default/fallback errorHandler
 */
module.exports = function transformError (error) {
  // delegate the error if it can turn itself into an object
  if (error.toJSON) {
    return error.toJSON();
  }

  var statusCode = error.statusCode || 500;
  var debug = Boolean(process.env.DEBUG)
  var body = (debug ? error.stack : STATUS_CODES[statusCode]) + '\n';

  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': body.length
    },
    body: body,
    error: error
  };
};
