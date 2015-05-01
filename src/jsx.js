import homunculus from 'homunculus';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res = '';

function recursion(node, cHash) {
  if(node.isToken()) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      res += token.content();
    }
  }
  else {
    switch(node.name()) {
      //TODO
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, cHash);
    });
  }
}

function parse(node, cHash) {
  res = '';
  recursion(node, cHash);
  return res;
}

export default parse;