// first create a generic "app" that responds to  messages
var createHandler = require('./');

// Create an application that takes in a message and produces a result
var app = createHandler();

app.route(':method /echo', function (request, requestBody) {
  return {
    body: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: requestBody.toString()
    }
  };
});

app.route('POST /eval', function (requestBody) {
  return {body: eval(requestBody.toString()) || null};
});

var server = app.listen(8888);
server.on('listening', function () {
  console.log('Listening on localhost:8888');
});
