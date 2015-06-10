define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var jsdc=function(){var _1=require('jsdc');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var ComponentName=function(){var _3=require('./ComponentName');return _3.hasOwnProperty("default")?_3["default"]:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Lefty() {
    this.parser = null;
    this.node = null;
  }

  Lefty.prototype.parse = function(code, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree(this.cHash);
    var res = tree.parse(this.node);
    return es5 ? jsdc.parse(res) : res;
  }

  var _4={};_4.tokens={};_4.tokens.get =function() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  _4.ast={};_4.ast.get =function() {
    return this.node;
  }
Object.keys(_4).forEach(function(k){Object.defineProperty(Lefty.prototype,k,_4[k])});

exports["default"]=new Lefty();
});