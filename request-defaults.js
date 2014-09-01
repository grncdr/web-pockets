var collectStream = require('lie-denodify')(require('collect-stream'));
var Cookies = require('cookies');

exports.requestBody = function (request) {
  return collectStream(request);
};

exports.result = getResult;
function getResult (matchedRoute) {
  var requestPocket = this;

  return (function tryNextMatch (match) {
    if (!match) {
      return { statusCode: 404, body: 'Not Found' };
    }
    var matchPocket = requestPocket.pocket();
    matchPocket.value('match', match);
    return matchPocket.run(match.fn).then(function (result) {
      // try next match if nothing was returned.
      return result || tryNextMatch(match.next());
    });
  })(matchedRoute);
}

exports.matchedRoute = getMatchedRoute;
function getMatchedRoute (router, request) {
  return router.match(request.method + ' ' + request.url) || false;
}

exports.cookies = loadCookies;
function loadCookies (request, response, cookieKeys) {
  return new Cookies(request, response, cookieKeys);
}
