function log(...msg) {
  console.log(new Date(), 'Parser', ...msg);
}

module.exports = {
  log,
};
