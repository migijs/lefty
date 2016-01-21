import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class InnerTree {
  constructor(isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
    this.isBind = isBind;
    this.setHash = setHash;
    this.getHash = getHash;
    this.varHash = varHash;
    this.modelHash = modelHash;
    this.thisHash = thisHash;
    this.thisModelHash = thisModelHash;
    this.res = '';
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
          this.res += jsx(node, true, this.setHash, this.getHash, this.varHash, this.modelHash, this.thisHash, this.thisModelHash);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }
}

export default InnerTree;
