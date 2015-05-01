define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var ES6Token = homunculus.getClass('token', 'js');
var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res;
var append;

function ignore(node, includeLine) {
  if(node instanceof Token || node instanceof ES6Token) {
    if(node.isVirtual()) {
      return;
    }
    node.ignore = true;
    append = '';
    while(node.next()) {
      node = node.next();
      if(node.isVirtual() || !S.hasOwnProperty(node.type())) {
        break;
      }
      var s = node.content();
      res += s;
      append += s;
      if(includeLine || s != '\n') {
        node.ignore = true;
      }
    }
  }
  else if(node.isToken()) {
    ignore(node.token(), includeLine);
  }
  else {
    node.leaves().forEach(function(leaf) {
      ignore(leaf, includeLine);
    });
  }
}

function parse(node, includeLine) {
  res = '';
  append = '';
  ignore(node, includeLine);
  return { res:res, append:append };
}

parse.S = S;

exports.default=parse;});