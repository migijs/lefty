import homunculus from 'homunculus';

var ES6Token = homunculus.getClass('token', 'js');
var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res;
var append;

function ignore(node, msg, includeLine) {
  if(node instanceof Token || node instanceof ES6Token) {
    if(node.isVirtual()) {
      return;
    }
    node.ignore = msg || true;
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
        node.ignore = msg || true;
      }
    }
  }
  else if(node.isToken()) {
    ignore(node.token(), msg, includeLine);
  }
  else {
    node.leaves().forEach(function(leaf) {
      ignore(leaf, msg, includeLine);
    });
  }
}

function parse(node, msg, includeLine) {
  res = '';
  append = '';
  ignore(node, msg, includeLine);
  return { res, append };
}

parse.S = S;

export default parse;