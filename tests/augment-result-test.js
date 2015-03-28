var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Augment `result`');

app.request.wrap('result', function (result) {
  return result().then(function (result) {
    result.headers['X-Neat'] = 'Coool';
    return result;
  });
});

app.route('GET /', function () {
  return { body: "Hi", headers: {} };
});

return test.get('/')
  .expect('Hi')
  .expect('x-neat', 'Coool')
  .expect('content-length', '2')
  .end(helpers.reportRequest);
