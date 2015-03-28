var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Wrap `result`');

app.request.wrap('result', function (result) {
  return {
    headers: { 'X-Lol': 'huehuehue' },
    body: 'Funny joke'
  };
});

return test.get('/')
  .expect('content-type', 'text/plain')
  .expect('content-length', '10')
  .expect('x-lol', 'huehuehue')
  .expect('Funny joke')
  .end(helpers.reportRequest);
