var questor = require('questor');
var assert = require('assert');

module.exports = test;
function test (name, body) {
  return testApp(require('./')(), name, body);
}

test.testApp = testApp;
function testApp (app, name, body) {
  if (typeof name === 'function') {
    body = name;
    name = body.name || '<anonymous test>';
  }
  var results = [];
  var assert = scopedAssert(results);

  app.listen(0, 'localhost').on('listening', function () {
    var server = this;
    var port = server.address().port;

    request.multi = function () {
      var results = [];
      for (var i in arguments) {
        results.push(request.apply(null, [].concat(arguments[i])));
      }
      return Promise.all(results);
    };

    body(assert, request, app).then(function () {
      server.close();
      if (!results.length) {
        return new Error('Test contained no assertions' + name);
      }
    }, function (err) {
      server.close();
      return err;
    }).then(function (err) {
      console.error('#', name);
      results.forEach(function (args, i) {
        args.splice(1, 0, (i + 1), '-');
        console.log.apply(null, args);
      });
      if (err) {
        console.error(err.stack);
        process.exit(1);
      }
    });

    function request (path, opts) {
      var uri = 'http://localhost:' + port + path;
      return questor(uri, opts);
    }
  });
}

function scopedAssert (results) {
  var reporter = {
    pass: function (message) {
      results.push(['ok', message]);
    },
    fail: function (message, error) {
      results.push(['not ok', error.message, message]);
    }
  };

  var base = wrapAssertion(assert, 'assert', reporter);

  for (var k in assert) if (typeof assert[k] === 'function') {
    base[k] = wrapAssertion(assert[k], k, reporter);
  }

  return base;
}

var slice = Function.prototype.call.bind(Array.prototype.slice);

function wrapAssertion (fn, name, log) {
  return function (message) {
    var args = slice(arguments, 1);
    try {
      fn.apply(null, args);
      log.pass(message);
    } catch (err) {
      var formatted = name + '(' + args.map(JSON.stringify).join(', ') + ')';
      log.fail(message + ' - ' + formatted, err);
      throw err;
    }
  };
}
