var assert = require('assert');
var app = require('../')();
var test = require('supertest')(app);
var helpers = require('./helpers');

console.log('# Routing');

/***** Setup *****/

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

/***** Requests *****/

test.get('/blah').expect('blahIndex').end(helpers.reportRequest);
test.get('/blah/twelve').expect('blahSingle twelve').end(helpers.reportRequest);
test.get('/').expect('root').end(helpers.reportRequest);
test.get('/blah?what=ok').expect('blahIndex').end(helpers.reportRequest);
