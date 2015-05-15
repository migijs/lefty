import homunculus from 'homunculus';
import jsdc from 'jsdc';
import Tree from './Tree';
import ComponentName from './ComponentName';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class Lefty {
  constructor() {
    this.parser = null;
    this.node = null;
    this.cHash = {};
  }

  parse(code, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.preRecursion(this.node);
    var tree = new Tree(this.cHash);
    var res = tree.parse(this.node);
    return es5 ? jsdc.parse(res) : res;
  }
  preRecursion(node) {
    var self = this;
    var isToken = node.isToken();
    if(!isToken) {
      switch(node.name()) {
        case Node.CLASSDECL:
          this.klass(node);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.preRecursion(leaf);
      });
    }
  }
  klass(node) {
    var heritage = node.leaf(2);
    if(heritage && heritage.name() == Node.HERITAGE) {
      var mmb = heritage.leaf(1);
      if(mmb.name() == Node.MMBEXPR) {
        var prmr = mmb.first();
        if(prmr.name() == Node.PRMREXPR) {
          var token = prmr.first();
          if(token.isToken() && token.token().content() == 'migi') {
            token = mmb.leaf(1);
            if(token.isToken() && token.token().content() == '.') {
              token = mmb.leaf(2);
              if(token.isToken() && ComponentName.hasOwnProperty(token.token().content())) {
                var id = node.leaf(1).first().token().content();
                this.cHash[id] = true;
              }
            }
          }
        }
      }
    }
  }

  get tokens() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  get ast() {
    return this.node;
  }
}

export default Lefty;
