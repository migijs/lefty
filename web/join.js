define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0["default"]:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1["default"]:_1}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var index;
var res;

function recursion(node, excludeLine) {
  if(node.isToken()) {
    var token = node.token();
    if(!token.isVirtual()) {
      res += token.content();
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
          break;
        }
        var s = token.content();
        if(!excludeLine || s != '\n') {
          res += token.content();
        }
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(leaf, excludeLine);
    });
  }
}

exports["default"]=function(node, excludeLine) {
  res = '';
  recursion(node, excludeLine);
  return res;
}});