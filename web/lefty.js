define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var Tree=function(){var _1=require('./Tree');return _1.hasOwnProperty("default")?_1["default"]:_1}();


  function Lefty() {
    this.parser = null;
    this.node = null;
  }

  Lefty.prototype.parse = function(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    return res = tree.parse(this.node);
  }

  Lefty.prototype.tokens = function() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  Lefty.prototype.ast = function() {
    return this.node;
  }


exports["default"]=new Lefty();
});