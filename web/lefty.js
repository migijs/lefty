define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var jsdc=function(){var _1=require('jsdc');return _1.hasOwnProperty("jsdc")?_1.jsdc:_1.hasOwnProperty("default")?_1.default:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("Tree")?_2.Tree:_2.hasOwnProperty("default")?_2.default:_2}();
var ComponentName=function(){var _3=require('./ComponentName');return _3.hasOwnProperty("ComponentName")?_3.ComponentName:_3.hasOwnProperty("default")?_3.default:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Lefty() {
    this.parser = null;
    this.node = null;
    this.cHash = {};
  }

  Lefty.prototype.parse = function(code, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    this.preRecursion(this.node);
    var tree = new Tree(this.cHash);
    var res = tree.parse(this.node);
    return es5 ? jsdc.parse(res) : res;
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

  var _4={};_4.tokens={};_4.tokens.get =function() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  _4.ast={};_4.ast.get =function() {
    return this.node;
  }
Object.keys(_4).forEach(function(k){Object.defineProperty(Lefty.prototype,k,_4[k])});

exports.default=Lefty;});
