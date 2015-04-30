import homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var single = null;

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

class Lefty {
  constructor() {
    this.parser = null;
    this.node = null;
    this.ignores = null;
    this.cHash = {};
    this.res = '';
  }

  parse(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.ignores = this.parser.ignore();
    this.preRecursion(this.node);
    this.recursion(this.node);
    return this.res;
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
        self.recursion(leaf);
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
          if(token.isToken()) {
            token = token.token();
            if(token.content() == 'migi') {
              token = mmb.leaf(1);
              if(token.isToken() && token.token().content() == '.') {
                token = mmb.leaf(2);
                if(token.isToken() && token.token().content() == 'Component') {
                  var id = node.leaf(1).first().token().content();
                  this.cHash[id] = true;
                }
              }
            }
          }
        }
      }
    }
  }
  recursion(node) {
    var self = this;
    var isToken = node.isToken();
    if(isToken) {
      var token = node.token();
      if(token.isVirtual()) {
        return;
      }
      this.res += token.content();
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !S.hasOwnProperty(token.type())) {
          break;
        }
        this.res += token.content();
      }
    }
    else {
      switch(node.name()) {
        //TODO
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }

  get tokens() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  get ast() {
    return this.node;
  }

  static parse(code) {
    single = new Lefty();
    return single.parse(code);
  }

  static get ast() {
    return single ? single.ast : null;
  }
  static get tokens() {
    return single ? single.tokens : null;
  }
}

export default Lefty;