import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class Tree {
  constructor(cHash) {
    this.cHash = cHash;
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
          this.res += jsx(node, this.cHash);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node);
          break;
      }
    }
  }
  fnbody(node) {
    var parent = node.parent();
    if(parent.name() == Node.METHOD) {
      var first = parent.first();
      if(first.isToken() && first.token().content() == 'set') {
        var top = parent.parent().parent().parent();
        var heritage = top.leaf(2);
        if(heritage.name() == Node.HERITAGE) {
          var mmb = heritage.leaf(1);
          if(mmb.name() == Node.MMBEXPR) {
            var prmr = mmb.first();
            if(prmr.name() == Node.PRMREXPR) {
              var token = prmr.first();
              if(token.isToken() && token.token().content() == 'migi') {
                token = mmb.last();
                if(token.isToken() && token.token().content() == 'Component') {
                  this.res += 'this.emit("data",this,"';
                  var name = parent.leaf(1).first().first().token().content();
                  this.res += name;
                  this.res += '");';
                }
              }
            }
          }
        }
      }
    }
  }
}

export default Tree;