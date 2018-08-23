import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

class InnerTree {
  constructor(opt = {}, param = {}) {
    this.res = '';
    this.opt = opt;
    this.param = param;
  }

  parse(node) {
    this.recursion(node);
    return this.res;
  }
  recursion(node) {
    let self = this;
    let isToken = node.isToken();
    if(isToken) {
      let token = node.token();
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
          this.res += jsx(node, { isInnerBind: this.opt.isBind }, self.param);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }
}

export default InnerTree;
