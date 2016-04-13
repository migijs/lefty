define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var jsx=function(){var _1=require('./jsx');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var render=function(){var _3=require('./render');return _3.hasOwnProperty("default")?_3["default"]:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');


  function Tree() {
    this.res = '';
  }

  Tree.prototype.parse = function(node) {
    this.recursion(node, false, {}, {});
    return this.res;
  }
  Tree.prototype.recursion = function(node, inClass, setHash, getHash) {
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
          this.res += jsx(node, false);
          return;
        case Node.CLASSDECL:
          inClass = this.klass(node);
          break;
        case Node.CLASSBODY:
          if(inClass) {
            this.list(node, setHash, getHash);
          }
          break;
        case Node.METHOD:
          var isRender = this.method(node);
          if(isRender) {
            this.res += render(node, setHash, getHash);
            return;
          }
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, inClass, setHash, getHash);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node, inClass, setHash, getHash);
          break;
        case Node.CLASSDECL:
          this.appendName(node);
          inClass = false;
          setHash = {};
          getHash = {};
          break;
      }
    }
  }
  Tree.prototype.klass = function(node) {
    var heritage = node.leaf(2);
    if(heritage && heritage.name() == Node.HERITAGE) {
      var body = node.last().prev();
      var leaves = body.leaves();
      for(var i = 0, len = leaves.length; i < len; i++) {
        var leaf = leaves[i];
        var method = leaf.first();
        if(method.name() == Node.METHOD) {
          var first = method.first();
          if(first.name() == Node.PROPTNAME) {
            var id = first.first();
            if(id.name() == Node.LTRPROPT) {
              id = id.first();
              if(id.isToken()) {
                id = id.token().content();
                if(id == 'constructor') {
                  return true;
                }
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
                if(token.isToken()) {
                  this.res += ';this.__data("';
                  var name = parent.leaf(1).first().first().token().content();
                  this.res += name;
                  this.res += '")';
                  return;
                }
              }
            }
          }
          //可能组件继承组件，无法得知继承自migi.xxx
          this.res += ';(this instanceof migi.Component||migi.browser.lie&&this.__migiCP)&&';
          this.res += 'this.__data("';
          var name = parent.leaf(1).first().first().token().content();
          this.res += name;
          this.res += '")';
        }
      }
    }
  }
  Tree.prototype.list = function(node, setHash, getHash) {
    node.leaves().forEach(function(leaf) {
      if(leaf.name() == Node.CLASSELEM) {
        var method = leaf.first();
        if(method.name() == Node.METHOD) {
          var first = method.first();
          if(first.isToken()) {
            var token = first.token();
            if(token.content() == 'set') {
              var name = first.next().first().first().token().content();
              setHash[name] = true;
            }
            else if(token.content() == 'get') {
              var name = first.next().first().first().token().content();
              getHash[name] = getHash[name] || [];
              var param = first.next().next().next();
              param.leaves().forEach(function(leaf, i) {
                if(i % 2 == 0 && leaf.name() == Node.SINGLENAME) {
                  first = leaf.first();
                  if(first.name() == Node.BINDID) {
                    first = first.first();
                    if(first.isToken()) {
                      getHash[name].push(first.token().content());
                    }
                  }
                }
              });
            }
          }
        }
      }
    });
  }
  Tree.prototype.appendName = function(node) {
    var heritage = node.leaf(2);
    //必须有继承
    if(heritage && heritage.name() == Node.HERITAGE) {
      //必须有constructor
      if(hasCons(node)) {
        var name = node.leaf(1).first().token().content();
        this.res += name + '.__migiName="' + name + '";';
      }
    }
  }


function hasCons(node) {
  var body = node.last().prev();
  var leaves = body.leaves();
  for(var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    var method = leaf.first();
    if(method.name() == Node.METHOD) {
      var first = method.first();
      if(first.name() == Node.PROPTNAME) {
        var id = first.first();
        if(id.name() == Node.LTRPROPT) {
          id = id.first();
          if(id.isToken()) {
            id = id.token().content();
            if(id == 'constructor') {
              return true;
            }
          }
        }
      }
    }
  }
}

exports["default"]=Tree;});