define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var jsdc=function(){var _1=require('jsdc');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("default")?_2["default"]:_2}();


  function Lefty() {
    this.parser = null;
    this.node = null;
  }

  Lefty.prototype.parse = function(code, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    var res = tree.parse(this.node);
    return es5 ? jsdc.parse(res) : res;
  }

  Lefty.prototype.tokens = function() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  Lefty.prototype.ast = function() {
    return this.node;
  }
  Lefty.prototype.reset = function() {
    lowIe.reset();
  }


exports["default"]=new Lefty();
});