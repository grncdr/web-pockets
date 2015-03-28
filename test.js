var testHttpServer = require('test-http-server');
var createHandler = require('./');

module.exports = test;
function test (initServer, testName, body) {
  if (arguments.length === 1) {
    testName = initServer;
    initServer = createHandler;
  }

  return testHttpServer(initServer, testName, body);
}
