module.exports = function (language, translations) {
  if (!translations[language]) {
    var err = new Error('Unknown language: ' + language);
    err.statusCode = 404;
    throw err;
  }
  return translations[language];
};

