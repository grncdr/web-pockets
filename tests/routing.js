var Promise = require('lie');
var test = require('../test');

// Create an application that takes in a message and produces a result
test(function RouteMatching (assert, request, app) {
  app.routes({
    'GET /': function () {
      return 'root';
    },

    'GET /blah': function () {
      return 'blahIndex';
    },

    'GET /blah/:id': function (matchedRoute) {
      return 'blahSingle ' + matchedRoute.params.id;
    }
  });

  return request('/blah').then(function (r) {
    assert.equal('/blah matched', 'blahIndex', r.body);

    return request('/blah/twelve').then(function (r) {
      assert.equal('/blah/:id matched', 'blahSingle twelve', r.body);

      return request('/').then(function (r) {
        assert.equal('/ matched', 'root', r.body);


        return request('/blah?what=ok').then(function (r) {
          assert.equal('/blah + querystring matched', 'blahIndex', r.body);
        });
      });
    });
  });
});
