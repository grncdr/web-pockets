exports['GET /greeting/:language'] = function (messages) {
  return messages.hello;
};

exports['GET /time/:language'] = function (messages) {
  return messages.theTime.replace('{time}', new Date());
};
