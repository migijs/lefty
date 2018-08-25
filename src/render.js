import homunculus from 'homunculus';
import ignore from './ignore';
import InnerTree from './InnerTree';
import jsx from './jsx';
import join2 from './join2';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

let res;

function stmt(node, param) {
  recursion(node, param);
}

function recursion(node, param) {
  if(node.isToken()) {
    let token = node.token();
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
        res += jsx(node, { isBind: true, }, param);
        return;
      case Node.FNEXPR:
      case Node.FNDECL:
      case Node.CLASSEXPR:
        let tree = new InnerTree();
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

  let len = node.size();
  node.leaves().forEach(function(leaf, i) {
    //fnbody
    if(i === len - 2) {
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
