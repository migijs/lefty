import homunculus from 'homunculus';

let ES6Token = homunculus.getClass('token', 'js');
let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

let S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

let res;
let append;

function ignore(node, includeLine) {
  if(node instanceof Token || node instanceof ES6Token) {
    if(node.isVirtual()) {
      return;
    }
    node.ignore = true;
    append = '';
    while(node = node.next()) {
      if(node.isVirtual() || !S.hasOwnProperty(node.type())) {
        break;
      }
      let s = node.content();
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
  return { res, append };
}

parse.S = S;

export default parse;