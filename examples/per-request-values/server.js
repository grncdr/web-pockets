'use strict';
var app = require('../../')();
app.value('translations', require('./translations'));

app.request.value('language', require('./request/language'));
app.request.value('messages', require('./request/messages'));

var routes = require('./routes');
for (var pattern in routes) {
  app.route(pattern, routes[pattern]);
}

if (!module.parent) {
  app.listen(8484).on('listening', function () {
    console.log('App running on http://localhost:8484/');
    console.log('Routes:');
    for (var pattern in routes) {
      console.log('  ' + pattern);
    }
  });
}
