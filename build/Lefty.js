var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var jsx=function(){var _1=require('./jsx');return _1.hasOwnProperty("jsx")?_1.jsx:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var single = null;


  function Lefty() {
    this.parser = null;
    this.node = null;
    this.cHash = {};
    this.res = '';
  }

  Lefty.prototype.parse = function(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.preRecursion(this.node);
    this.recursion(this.node);
    return this.res;
  }
  Lefty.prototype.preRecursion = function(node) {
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
  Lefty.prototype.klass = function(node) {
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
  Lefty.prototype.recursion = function(node) {
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
          ignore(node, true);
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
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