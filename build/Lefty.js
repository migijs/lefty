var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var single = null;

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;


  function Lefty() {
    this.parser = null;
    this.node = null;
    this.ignores = null;
    this.res = '';
  }

  Lefty.prototype.parse = function(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.ignores = this.parser.ignore();
    this.recursion(this.node);
    return this.res;
  }
  Lefty.prototype.recursion = function(node) {
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
  Lefty.prototype.klass = function(node) {
    //TODO
  }

  Object.defineProperty(Lefty.prototype, "tokens", {get :function() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }});
  Object.defineProperty(Lefty.prototype, "ast", {get :function() {
    return this.node;
  }});

  Lefty.parse=function(code) {
    single = new Lefty();
    return single.parse(code);
  }

  Object.defineProperty(Lefty, "ast", {get :function() {
    return single ? single.ast : null;
  }});
  Object.defineProperty(Lefty, "tokens", {get :function() {
    return single ? single.tokens : null;
  }});


exports.default=Lefty;