var assert = require('assert');

exports.correctContentLength = function (response) {
  assert.equal(response.text.length, response.headers['content-length']);
};

exports.reportRequest = function reportRequest (error, response) {
  if (error) {
    throw error;
  } else {
    console.log('ok', '-', response.req.method, response.req.path);
  }
};
