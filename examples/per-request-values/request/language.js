module.exports = function (match) {
  return (match.params && match.params.language) || 'de';
};
