define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var jsdc=function(){var _1=require('jsdc');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var lowIe=function(){var _3=require('./lowIe');return _3.hasOwnProperty("default")?_3["default"]:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Lefty() {
    this.parser = null;
    this.node = null;
  }

  Lefty.prototype.parse = function(code, lie, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    var res = tree.parse(this.node);
    if(lie) {
      var parser = homunculus.getParser('es6');
      var node = parser.parse(res);
      var lexer = parser.lexer;
      var ids = {};
      lexer.tokens().forEach(function(token) {
        if(token.type() == Token.ID) {
          var s = token.content();
          if(/^\d+$/.test(s)) {
            ids['_' + s] = true;
          }
        }
      });
      res = lowIe.parse(node, ids);
    }
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