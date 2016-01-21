define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var jsx=function(){var _1=require('./jsx');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("default")?_2["default"]:_2}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function InnerTree(isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
    this.isBind = isBind;
    this.setHash = setHash;
    this.getHash = getHash;
    this.varHash = varHash;
    this.modelHash = modelHash;
    this.thisHash = thisHash;
    this.thisModelHash = thisModelHash;
    this.res = '';
  }

  InnerTree.prototype.parse = function(node) {
    this.recursion(node);
    return this.res;
  }
  InnerTree.prototype.recursion = function(node) {
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


exports["default"]=InnerTree;
});