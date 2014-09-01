var assert = require('assert');
var test = require('../test');

test(function overrideResponder (assert, app, request) {
  app.value('responder', function () {
    return function (response) {
      response.end('Hello World');
    };
  });

  return request('/').then(function (result) {
    // No standard headers
    assert('No default Content-Type header', !result.headers['content-type']);
    assert('No default Content-Length header', !result.headers['content-length']);
    assert.equal('Custom Body', result.body, 'Hello World');
  });
});

test(function overrideResult (assert, app, request) {
  app.request.value('result', {
    headers: { 'X-Lol': 'huehuehue' },
    body: 'Funny joke'
  });

  return request('/').then(function (result) {
    // standard header
    assert.equal('Default Content-Type', result.headers['content-type'], 'text/plain');
    assert.equal('Default Content-Length', result.headers['content-length'], '10');
    assert.equal('Custom Header', result.headers['x-lol'], 'huehuehue');
    assert.equal('Custom body', result.body, 'Funny joke');
  });
});

test(function augmentResult (assert, app, request) {
  app.request.value('result', function (defaultResult) {
    defaultResult.headers['X-Neat'] = 'Coool';
    return defaultResult;
  });

  app.route('GET /', function () {
    return {
      body: "Hi",
      headers: {}
    };
  });

  return request('/').then(function (result) {
    assert.equal('Extra header', result.headers['x-neat'], 'Coool');
  });
});
