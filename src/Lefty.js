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
    this.res = '';
  }

  parse(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.ignores = this.parser.ignore();
    this.recursion(this.node);
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
        case Node.CLASS:
          this.klass(node);
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }
  klass(node) {
    //TODO
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