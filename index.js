if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = new (require('./web/Lefty').default);
  });
}
else {
  module.exports = new (require('./build/Lefty').default);
}