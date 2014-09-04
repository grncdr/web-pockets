var Promise = require('lie');
var test = require('../test');

// Create an application that takes in a message and produces a result
test(function EchoServer (assert, app, request) {
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

  return Promise.all([
    request('/hallo').then(function (response) {
      assert.equal('Content-Type', response.headers['content-type'], 'application/json');
      assert.equal('Content-Length', response.headers['content-length'], response.body.length);
      var body = JSON.parse(response.body);
      assert.equal('URL', body.url, '/hallo');
      assert.equal('HTTP verb', body.method, 'GET');
    }),
    request('/goodbye', {method: 'POST', body: 'Hey there'}).then(function (response) {
      var body = JSON.parse(response.body);
      assert.equal('Received body', body.body, 'Hey there');
      assert.equal('HTTP verb', body.method, 'POST');
    })
  ]);
});
