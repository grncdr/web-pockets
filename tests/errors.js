var Promise = require('lie');
var test = require('../test');

test(function ErrorHandling (assert, request, app) {
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

  return Promise.all([
    request('/bare-error').catch(function (response) {
      assert.equal('Content-Type header', response.headers['content-type'], 'text/plain');
      assert.equal('Content-Length header', response.headers['content-length'], response.body.length);

      console.log(response.body);

      assert.equal('Default response', response.body, 'Internal Server Error\n');
    }),

    request('/json-error').catch(function (response) {
      assert.equal('Content-Type header', response.headers['content-type'], 'application/json');
      assert.equal('Content-Length header', response.headers['content-length'], response.body.length);
      assert.equal('Custom header on error', response.headers['x-movie'], 'Interstellar');

      var body = JSON.parse(response.body);

      assert.equal('Default response', body.message, 'whoops!');
      assert.equal('Default response', body.id, 'Lol');
    }),
  ]);
});
