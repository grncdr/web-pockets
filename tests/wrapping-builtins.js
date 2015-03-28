var test = require('../test');

test(function overrideResponder (assert, request, app) {
  app.wrap('responder', function (responder) {
    return function (response) {
      response.end('Hello World');
    };
  });

  return request('/').then(function (result) {
    assert.isUndefined('Content-Type header', result.headers['content-type']);

    // hacky detection of iojs. See https://github.com/iojs/io.js/pull/1062
    if (process.version.slice(0, 2) !== 'v1') {
      assert.isUndefined('Content-Length header', result.headers['content-length']);
    }

    assert.equal('Custom Body', result.body, 'Hello World');
  });
});

test(function overrideResult (assert, request, app) {
  app.request.wrap('result', function (result) {
    return {
      headers: { 'X-Lol': 'huehuehue' },
      body: 'Funny joke'
    };
  });

  return request('/').then(function (result) {
    // standard header
    assert.equal('Default Content-Type', result.headers['content-type'], 'text/plain');
    assert.equal('Default Content-Length', result.headers['content-length'], '10');
    assert.equal('Custom Header', result.headers['x-lol'], 'huehuehue');
    assert.equal('Custom body', result.body, 'Funny joke');
  });
});

test(function augmentResult (assert, request, app) {
  app.request.wrap('result', function (result) {
    return result().then(function (result) {
      result.headers['X-Neat'] = 'Coool';
      return result;
    });
  });

  app.route('GET /', function () {
    return { body: "Hi", headers: {} };
  });

  return request('/').then(function (result) {
    assert.equal('Extra header', result.headers['x-neat'], 'Coool');
  });
});
