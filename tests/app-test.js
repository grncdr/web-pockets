var assert = require('assert');
var app = require('../')();
var called = false;

var server = app.listen(1337, '0.0.0.0', function () {
  called = true;
});

setTimeout(function () {
  assert(called);

  server.close();
}, 1000);
