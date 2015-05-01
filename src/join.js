import homunculus from 'homunculus';
import ignore from './ignore';

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

export default function(node, excludeLine) {
  res = '';
  recursion(node, excludeLine);
  return res;
}