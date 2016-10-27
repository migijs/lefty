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
    this.recursion(node, false);
    return this.res;
  }
  Tree.prototype.recursion = function(node, inClass) {
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
            this.param = {
              getHash: {},
              setHash: {},
              bindHash: {},
              linkHash: {},
              linkedHash: {}
            };
            this.list(node);
          }
          break;
        case Node.METHOD:
          var isRender = this.method(node);
          if(isRender) {
            this.res += render(node, this.param || {});
            return;
          }
          break;
        case Node.ANNOT:
          this.res += ignore(node, true).res;
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, inClass);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node, inClass);
          break;
        case Node.CLASSDECL:
          this.appendName(node);
          inClass = false;
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
    return false;
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
        var name = parent.leaf(1).first().first().token().content();
        var prev = parent.parent().prev();
        var ids = [];
        if(prev) {
          prev = prev.first();
          if (prev.name() == Node.ANNOT && prev.first().token().content() == '@bind') {
            ids.push(name);
          }
        }
        ids = ids.concat(this.param.linkedHash[name] || []);
        if(ids.length) {
          if (ids.length == 1) {
            this.res += ';this.__data("';
            this.res += ids[0];
            this.res += '")';
          }
          else {
            this.res += ';this.__data(["';
            this.res += ids.join('","');
            this.res += '"])';
          }
        }
      }
    }
  }
  Tree.prototype.list = function(node) {
    var leaves = node.leaves();
    var length = leaves.length;
    for(var i = 0; i < length; i++) {
      var item = leaves[i].first();
      if(item.name() == Node.ANNOT) {
        var annot = item.first().token().content();
        var method = leaves[i+1] ? leaves[i+1].first() : null;
        if(method && method.name() == Node.METHOD) {
          var first = method.first();
          if(first.isToken()) {
            var token = first.token().content();
            if(token == 'set' && annot == '@bind') {
              var name = first.next().first().first().token().content();
              this.param.bindHash[name] = true;
            }
            else if(token == 'get' && annot == '@link') {
              var name = first.next().first().first().token().content();
              this.param.linkHash[name] = this.param.linkHash[name] || [];
              var params = item.leaf(2);
              if(params && params.name() == Node.FMPARAMS) {
                params.leaves().forEach(function(param) {
                  if(param.name() == Node.SINGLENAME) {
                    param = param.first();
                    if(param.name() == Node.BINDID) {
                      param = param.first();
                      if(param.isToken()) {
                        param = param.token().content();
                        this.param.linkHash[name].push(param);
                        this.param.linkedHash[param] = this.param.linkedHash[param] || [];
                        this.param.linkedHash[param].push(name);
                      }
                    }
                  }
                }.bind(this));
              }
            }
          }
        }
      }
      else if(item.name() == Node.METHOD) {
        var first = item.first();
        if(first.isToken()) {
          var token = first.token().content();
          var name = first.next().first().first().token().content();
          if(token == 'get') {
            this.param.getHash[name] = true;
          }
          else if(token == 'set') {
            this.param.setHash[name] = true;
          }
        }
      }
    }
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