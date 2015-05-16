define(function(require, exports, module) {
  var lefty = require('./index');
  lefty.init = function() {
    var jsx = document.querySelectorAll('script');
    for(var i = 0, len = jsx.length; i < len; i++) {
      var node = jsx[i];
      if(node.getAttribute('type') == 'text/jsx') {
        var code = node.textContent || node.innerText;
        if(!code) {
          continue;
        }
        code = lefty.parse(code, true);
        if(node.textContent) {
          node.textContent = code;
        }
        else {
          node.innerText = code;
        }
      }
    }
  }
  module.exports = lefty;
});