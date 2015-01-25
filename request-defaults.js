var bops = require('bops');
var collectStream = require('lie-denodify')(require('collect-stream'));
var Cookies = require('cookies');
var isStream = require('isa-stream').Readable;
var url = require('url');

var wrapError = require('./wrap-error');

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

  return this.run(matchedRoute.handler).then(normalizeResult, wrapError);

  function normalizeResult (result) {
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
  }
}

exports.matchedRoute = getMatchedRoute;
function getMatchedRoute (router, request, parsedUrl) {
  return router.get(request.method + ' ' + parsedUrl.pathname) || false;
}

exports.parsedUrl = parsedUrl;
function parsedUrl (request) {
  return url.parse(request.url, true);
}

exports.queryParams = getQueryParams;
function getQueryParams (parsedUrl) {
  return parsedUrl.query;
}

exports.cookies = loadCookies;
function loadCookies (request, response, cookieKeys) {
  return new Cookies(request, response, cookieKeys);
}
