import homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res;
var append;

function ignore(node, includeLine) {
  if(node instanceof Token) {
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
      var s = ig.content();
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

export default function(node, includeLine) {
  res = '';
  append = '';
  ignore(node, includeLine);
  return { res, append };
};