import homunculus from 'homunculus';
import ignore from './ignore';
import Tree from './Tree';
import jsx from './jsx';
import join2 from './join2';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res;

function stmt(node, param) {
  recursion(node, param);
}

function recursion(node, param) {
  if(node.isToken()) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    if(!token.ignore) {
      res += token.content();
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      if(!token.ignore) {
        res += token.content();
      }
    }
  }
  else {
    switch(node.name()) {
      case Node.JSXElement:
      case Node.JSXSelfClosingElement:
        res += jsx(node, true, param);
        return;
      case Node.FNEXPR:
      case Node.FNDECL:
      case Node.CLASSEXPR:
        var tree = new Tree();
        res += tree.parse(node);
        return;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, param);
    });
  }
}

function parse(node, param) {
  res = '';

  var len = node.size();
  node.leaves().forEach(function(leaf, i) {
    //fnbody
    if(i == len - 2) {
      leaf.leaves().forEach(function(item) {
        stmt(item, param);
      });
    }
    else {
      res += join2(leaf);
    }
  });
  return res;
}

export default parse;
