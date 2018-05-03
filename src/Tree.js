import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';
import render from './render';
import join2 from './join2';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class Tree {
  constructor(isCb) {
    this.isCb = isCb;
    this.res = '';
  }

  parse(node) {
    this.recursion(node, false);
    return this.res;
  }
  recursion(node, inClass) {
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
          this.res += jsx(node, false, this.isCb, this.param);
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
        case Node.LEXBIND:
          if(inClass && node.parent().name() == Node.CLASSELEM) {
            this.res += this.bindLex(node);
            return;
          }
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
  klass(node) {
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
  method(node) {
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
  fnbody(node, inClass) {
    if(!inClass) {
      return;
    }
    var parent = node.parent();
    if(parent.name() == Node.METHOD) {
      var setV;
      var first = parent.first();
      if(first.isToken() && first.token().content() == 'set') {
        var fmparams = parent.leaf(3);
        if(fmparams && fmparams.name() == Node.FMPARAMS) {
          var single = fmparams.first();
          if(single && single.name() == Node.SINGLENAME) {
            var bindid = single.first();
            if(bindid && bindid.name() == Node.BINDID) {
              setV = bindid.first().token().content();
            }
          }
        }
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
          if(setV) {
            if(ids.length == 1) {
              this.res += ';this.__array("';
              this.res += ids[0] + '",';
              this.res += setV;
              this.res += ')';
            }
            else {
              this.res += ';this.__array(["';
              this.res += ids.join('","') + '"],';
              this.res += setV;
              this.res += ')';
            }
          }
          if(ids.length == 1) {
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
  list(node) {
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
        else if(method && method.name() == Node.LEXBIND) {
          var first = method.first();
          if(first.name() == Node.BINDID) {
            var name = first.first().token().content();
            parseLex(this.param, name, item, annot);
          }
        }
        //连续2个
        else if(method && method.name() == Node.ANNOT) {
          var item2 = method;
          var annot2 = method.first().token().content();
          method = leaves[i+2] ? leaves[i+2].first() : null;
          if(method && method.name() == Node.LEXBIND) {
            var first = method.first();
            if(first.name() == Node.BINDID) {
              var name = first.first().token().content();
              parseLex(this.param, name, item, annot);
              parseLex(this.param, name, item2, annot2);
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
      else if(item.name() == Node.LEXBIND) {
        var first = item.first();
        if(first.name() == Node.BINDID) {
          var name = first.first().token().content();
          this.param.getHash[name] = true;
          this.param.setHash[name] = true;
        }
      }
    }
  }
  appendName(node) {
    var heritage = node.leaf(2);
    //必须有继承
    if(heritage && heritage.name() == Node.HERITAGE) {
      //必须有constructor
      if(hasCons(node)) {
        var name = node.leaf(1).first().token().content();
        this.res += 'migi.name(' + name + ',"' + name + '");';
      }
    }
  }
  bindLex(node) {
    var parent = node.parent();
    var bindid = node.first();
    if(bindid.name() == Node.BINDID) {
      var token = bindid.first();
      var name = token.token().content();
      var init = node.leaf(1);
      
      var ids = [];
      var prev = parent.prev();
      if(prev) {
        prev = prev.first();
        if(prev.name() == Node.ANNOT && prev.first().token().content() == '@bind') {
          ids.push(name);
        }
      }
      ids = ids.concat(this.param.linkedHash[name] || []);
      
      var s = '';
      s += 'set ' + name + '(v){';
      s += 'this.__setBind("' + name + '",v)';
      if(ids.length) {
        if(ids.length == 1) {
          s += ';this.__data("';
          s += ids[0];
          s += '")';
        }
        else {
          s += ';this.__data(["';
          s += ids.join('","');
          s += '"])';
        }
      }
      s += '}get ' + name + '(){';
      s += ignore(token).res;
      if(init) {
        s += 'if(this.__initBind("' + name + '"))';
        s += 'this.__setBind("' + name + '",';
        s += ignore(init.first()).res;
        s += join2(init.last());
        s += ');';
      }
      s += 'return this.__getBind("' + name + '")}';
      return s;
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

function parseLex(param, name, item, annot) {
  if(annot == '@bind') {
    param.bindHash[name] = true;
  }
  else if(annot == '@link') {
    param.linkHash[name] = param.linkHash[name] || [];
    var params = item.leaf(2);
    if(params && params.name() == Node.FMPARAMS) {
      params.leaves().forEach(function(item) {
        if(item.name() == Node.SINGLENAME) {
          item = item.first();
          if(item.name() == Node.BINDID) {
            item = item.first();
            if(item.isToken()) {
              item = item.token().content();
              param.linkHash[name].push(item);
              param.linkedHash[item] = param.linkedHash[item] || [];
              param.linkedHash[item].push(name);
            }
          }
        }
      });
    }
  }
}

export default Tree;