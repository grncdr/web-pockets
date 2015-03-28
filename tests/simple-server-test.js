var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Echo server');

/***** Setup *****/

app.route(':method /*', function (request, requestBody) {
  return {
    body: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: requestBody.toString()
    }
  };
});

test.get('/hallo')
  .expect('Content-Type', 'application/json')
  .expect(helpers.correctContentLength)
  .expect(function (response) {
    assert.equal(response.body.url, '/hallo');
    assert.equal(response.body.method, 'GET');
  })
  .end(helpers.reportRequest);

test.post('/goodbye')
  .send('Hey there')
  .expect(function (response) {
    assert.equal(response.body.body, 'Hey there');
    assert.equal(response.body.method, 'POST');
  })
  .end(helpers.reportRequest);
