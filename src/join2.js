import homunculus from 'homunculus';

let Token = homunculus.getClass('token', 'jsx');

let S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

let res;

function recursion(node, excludeLine) {
  if(node.isToken()) {
    let token = node.token();
    if(!token.isVirtual()) {
      res += token.content();
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !S.hasOwnProperty(token.type())) {
          break;
        }
        let s = token.content();
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

export default function(node, excludeLine) {
  res = '';
  recursion(node, excludeLine);
  return res;
}