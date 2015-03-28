var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Wrap `responder`');

app.wrap('responder', function (responder) {
  return function (response) {
    response.end('Hello World');
  };
});

test.get('/')
  .expect('Hello World')
  .expect(function (response) {
    assert.equal(response.headers['content-type'], void(0))
  })
  .end(helpers.reportRequest);
