define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var jsx=function(){var _1=require('./jsx');return _1.hasOwnProperty("jsx")?_1.jsx:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Tree(cHash) {
    this.cHash = cHash;
    this.res = '';
  }

  Tree.prototype.parse = function(node) {
    this.recursion(node);
    return this.res;
  }
  Tree.prototype.recursion = function(node) {
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
    }
  }


exports.default=Tree;});