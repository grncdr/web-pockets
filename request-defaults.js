var bops = require('bops');
var collectStream = require('lie-denodify')(require('collect-stream'));
var Cookies = require('cookies');
var isStream = require('isa-stream').Readable;
var querystring = require('querystring');

exports.requestBody = function (request) {
  var body = collectStream(request);
  request.resume();
  return body;
};

exports.parsedBody = function (requestBody) {
  return JSON.parse(requestBody);
};

exports.result = getResult;
function getResult (matchedRoute) {
  if (!matchedRoute) {
    return { statusCode: 404, headers: {}, body: 'Not Found' };
  }
  return this.run(matchedRoute.fn).then(function (result) {
    if (typeof result !== 'object' ||
        bops.is(result) ||
        isStream(result) ||
        !result.hasOwnProperty('body'))
    {
      result = { body: result };
    }
    return {
      statusCode: result.statusCode || 200,
      headers:    result.headers    || {},
      body:       result.body       || ''
    };
  });
}

exports.matchedRoute = getMatchedRoute;
function getMatchedRoute (router, request) {
  return router.match(request.method + ' ' + request.url) || false;
}

exports.queryParams = getQueryParams;
function getQueryParams (request) {
  return querystring.parse(request.url.split('?').slice(1).join('?'));
}

exports.cookies = loadCookies;
function loadCookies (request, response, cookieKeys) {
  return new Cookies(request, response, cookieKeys);
}
