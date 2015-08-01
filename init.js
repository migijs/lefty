define(function(require, exports, module) {
  var lefty = require('./web/lefty')['default'];
  lefty.init = function() {
    var jsx = document.querySelectorAll('script');
    for(var i = 0, len = jsx.length; i < len; i++) {
      var node = jsx[i];
      if(node.getAttribute('type') == 'text/jsx' && !node.getAttribute('lefty')) {
        node.setAttribute('lefty', 1);
        var code = node.textContent || node.text;
        if(!code) {
          continue;
        }
        code = lefty.parse(code, true, true);
        node.textContent = node.text = code;
      }
    }
  }
  module.exports = lefty;
});