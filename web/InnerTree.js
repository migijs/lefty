define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var Tree=function(){var _1=require('./Tree');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var jsx=function(){var _2=require('./jsx');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var ignore=function(){var _3=require('./ignore');return _3.hasOwnProperty("default")?_3["default"]:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function InnerTree(param) {
    if(Tree.hasOwnProperty('default')) {
      Tree = Tree['default'];
    }
    if(jsx.hasOwnProperty('default')) {
      jsx = jsx['default'];
    }
    this.res = '';
    this.param = param;
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
          this.res += jsx(node, true, true, self.param);
          return;
        case Node.FNEXPR:
        case Node.FNDECL:
        case Node.CLASSEXPR:
          var tree = new Tree();
          this.res += tree.parse(node);
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
    }
  }


exports["default"]=InnerTree;
});