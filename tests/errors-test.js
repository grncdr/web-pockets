var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Errors');

/***** Setup *****/

app.route('GET /bare-error', function () {
  throw new Error('whoops!');
});

app.route('GET /json-error', function () {
  var error = new Error('whoops!');
  error.toJSON = function () {
    return {
      statusCode: 440,
      headers: { 'X-Movie': 'Interstellar' },
      body: { message: 'whoops!', id: 'Lol' },
    }
  };
  throw error;
});

app.route('GET /error-with-headers', function () {
  var error = new Error('Hey');
  error.headers = {'content-type': 'text/wtf'};
  throw error;
});

/***** Requests *****/

test.get('/bare-error')
  .expect('content-type', 'text/plain')
  .expect(helpers.correctContentLength)
  .expect('Internal Server Error\n')
  .end(helpers.reportRequest);

test.get('/json-error')
  .expect('content-type', 'application/json')
  .expect(helpers.correctContentLength)
  .expect('x-movie', 'Interstellar')
  .expect({message: 'whoops!', id: 'Lol'})
  .end(helpers.reportRequest);

test.get('/error-with-headers')
  .expect('content-type', 'text/wtf')
  .expect(helpers.correctContentLength)
  .end(helpers.reportRequest);
