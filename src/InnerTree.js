import homunculus from 'homunculus';
import Tree from './Tree';
import jsx from './jsx';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class InnerTree {
  constructor(param) {
    this.res = '';
    this.param = param;
  }

  parse(node) {
    this.recursion(node);
    return this.res;
  }
  recursion(node) {
    var self = this;
    var isToken = node.isToken();
    if(isToken) {
      var token = node.token();
      if(token.isVirtual()) {
        return;
      }
      if(!token.ignore) {
        this.res += token.content();
      }
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
          break;
        }
        if(!token.ignore) {
          this.res += token.content();
        }
      }
    }
    else {
      switch(node.name()) {
        case Node.JSXElement:
        case Node.JSXSelfClosingElement:
          this.res += jsx(node, true, self.param);
          return;
        case Node.FNEXPR:
        case Node.FNDECL:
        case Node.CLASSEXPR:
          var tree = new Tree();
          this.res += tree.parse(node);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }
}

export default InnerTree;
