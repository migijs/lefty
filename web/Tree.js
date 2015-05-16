define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var jsx=function(){var _1=require('./jsx');return _1.hasOwnProperty("jsx")?_1.jsx:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var ComponentName=function(){var _3=require('./ComponentName');return _3.hasOwnProperty("ComponentName")?_3.ComponentName:_3.hasOwnProperty("default")?_3.default:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Tree() {
    this.res = '';
  }

  Tree.prototype.parse = function(node) {
    this.recursion(node);
    return this.res;
  }
  Tree.prototype.recursion = function(node, inClass, inRender) {
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
          this.res += jsx(node, inClass, inRender);
          return;
        case Node.CLASSDECL:
          inClass = this.klass(node);
          break;
        case Node.METHOD:
          inRender = this.method(node);
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, inClass, inRender);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node, inClass);
          break;
      }
    }
  }
  Tree.prototype.klass = function(node) {
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
                return true;
              }
            }
          }
        }
      }
    }
  }
  Tree.prototype.method = function(node) {
    var first = node.first();
    if(first.name() == Node.PROPTNAME) {
      first = first.first();
      if(first.name() == Node.LTRPROPT) {
        first = first.first();
        if(first.isToken() && first.token().content() == 'render') {
          return true;
        }
      }
    }
  }
  Tree.prototype.fnbody = function(node, inClass) {
    if(!inClass) {
      return;
    }
    var parent = node.parent();
    if(parent.name() == Node.METHOD) {
      var first = parent.first();
      if(first.isToken() && first.token().content() == 'set') {
        var top = parent.parent().parent().parent();
        var heritage = top.leaf(2);
        if(heritage.name() == Node.HERITAGE) {
          var mmb = heritage.leaf(1);
          if(mmb.name() == Node.MMBEXPR) {
            var prmr = mmb.first();
            if(prmr.name() == Node.PRMREXPR) {
              var token = prmr.first();
              if(token.isToken() && token.token().content() == 'migi') {
                token = mmb.last();
                if(token.isToken() && ComponentName.hasOwnProperty(token.token().content())) {
                  this.res += 'this.emit(migi.Event.DATA,"';
                  var name = parent.leaf(1).first().first().token().content();
                  this.res += name;
                  this.res += '");';
                }
              }
            }
          }
        }
      }
    }
  }


exports.default=Tree;});