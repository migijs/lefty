define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var join=function(){var _2=require('./join');return _2.hasOwnProperty("default")?_2["default"]:_2}();

var Token = homunculus.getClass('token', 'jsx');
var JsNode = homunculus.getClass('node', 'jsx');

var uid = 0;

function getUid(ids) {
  var temp;
  while(temp = '_' + uid++) {
    if(!ids.hasOwnProperty('_' + temp)) {
      return temp;
    }
  }
}

var hash = {};
var prptHash = {};

var CALL = 1;
var APPLY = 2;

function recursion(node, ids) {
  var isToken = node.name() == JsNode.TOKEN;
  if(isToken) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    var s = token.content();
    switch(s) {
      case '(':
        prpts(node, true);
        break;
      case 'super':
        supers(node);
        break;
      case '...':
        rest(node);
        break;
      case ')':
        rp(node);
        break;
    }
    if(!token.ignore) {
      res += s;
    }
    switch(s) {
      case '(':
        prpts(node);
        break;
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      if(!token.ignore) {
        res += token.content();
      }
    }
  }
  else {
    switch(node.name()) {
      case JsNode.CLASSDECL:
        decl(node, ids, true);
        break;
      case JsNode.CLASSELEM:
        elem(node, ids);
        break;
      case JsNode.PROPTNAME:
        prptn(node);
        break;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ids);
    });
    switch(node.name()) {
      case JsNode.CLASSDECL:
        decl(node, ids);
        break;
      case JsNode.FNBODY:
        body(node, ids);
        break;
    }
  }
}

function decl(node, ids, start) {
  var nid = node.nid();
  if(start) {
    ignore(node.leaf(0));
    ignore(node.leaf(1));
    ignore(node.leaf(2));
    ignore(node.leaf(3));
    ignore(node.leaf(5));
    res += '!function(){';
    var temp = getUid(ids);
    var o = {};
    o.name = node.leaf(1).first().token().content();
    o.extend = join(node.leaf(2).last());
    res += 'var ' + temp + '=Object.create(' + o.extend + '.prototype);';
    res += temp + '.constructor=' + o.name + ';'
    res += o.name + '.prototype=' + temp;
    res += '}();';
    o.gsName = getUid(ids);
    o.gs = {};
    res += 'var ' + o.gsName + '={};';
    hash[nid] = o;
  }
  else {
    var o = hash[nid];
    res += 'if(!migi.browser.lie){';
    res += 'Object.defineProperties(';
    res += o.name + '.prototype,';
    res += o.gsName + ')';
    if(o.gssName) {
      res += ';Object.defineProperties(';
      res += o.name + ',';
      res += o.gssName + ')';
    }
    res += '}';
    res += 'Object.keys(' + o.extend + ').forEach(function(k){' + o.name + '[k]=' + o.extend + '[k]});'
  }
}

function elem(node, ids) {
  var first = node.first();
  var top = node.parent().parent();
  var tid = top.nid();
  var o = hash[tid];
  if(first.name() == JsNode.METHOD) {
    first = first.first();
    //method
    if(first.name() == JsNode.PROPTNAME) {
      var token = first.first().first().token();
      ignore(token, true);
      if(token.content() == 'constructor') {
        res += 'function ';
        res += o.name;
      }
      else {
        res += o.name;
        res += '.prototype.' + token.content() + '=function';
      }
    }
    //get/set
    else {
      var token = first.token();
      var prptn = first.next();
      ignore(prptn);
      if(token.content() == 'get' || token.content() == 'set') {
        var n = prptn.first().first().token();
        var s = n.content();
        if(!o.gs.hasOwnProperty(s)) {
          res += o.gsName + '.' + s + '={};';
          o.gs[s] = true;
        }
        res += o.gsName + '.' + s + '.';
      }
    }
  }
  else if(first.name() == JsNode.TOKEN
    && first.token().content() == 'static') {
    var token = first.token();
    first = first.next().first();
    ignore(token);
    if(first.name() == JsNode.PROPTNAME) {
      res += o.name + '.';
    }
    //get/set
    else {
      if(!o.gssName) {
        o.gssName = getUid(ids);
        o.gss = {};
        res += 'var ' + o.gssName + '={};';
      }
      var prptn = first.next();
      ignore(prptn);
      var n = prptn.first().first().token();
      var s = n.content();
      if(!o.gss.hasOwnProperty(s)) {
        res += o.gssName + '.' + s + '={};';
        o.gss[s] = true;
      }
      res += o.gssName + '.' + s + '.';
    }
  }
}

function prptn(node) {
  var parent = node.parent();
  if(parent.name() == JsNode.METHOD) {
    var prev = node.prev();
    if(prev && prev.name() == JsNode.TOKEN) {
      var token = prev.token();
      var s = token.content();
      if(s == 'get' || s == 'set') {
        res += '=function';
      }
    }
  }
}

function prpts(node, start) {
  var parent = node.parent();
  var prev = parent.prev();
  var nid = node.nid();
  if(start) {
    if(parent.name() == JsNode.METHOD
      && prev
      && prev.isToken()
      && prev.token().content() == 'static') {
      if(parent.first().name() == JsNode.TOKEN
        && ['get', 'set'].indexOf(parent.first().token().content()) > -1) {
        return;
      }
      parent = parent.parent();
      if(parent.name() == JsNode.CLASSELEM) {
        res += '=function';
      }
    }
    //super.xxx()
    else if(parent.name() == JsNode.ARGS) {
      parent = parent.parent();
      if(parent.name() == JsNode.CALLEXPR) {
        var mmbexpr = parent.first();
        if(mmbexpr.name() == JsNode.MMBEXPR) {
          var sup = mmbexpr.first();
          if(sup.isToken() && sup.token().content() == 'super') {
            var next = node.next();
            if(next.name() == JsNode.ARGLIST) {
              var hasRest = false;
              if(next.size() > 1) {
                var rest = next.last().prev();
                if(rest.isToken() && rest.token().content() == '...') {
                  hasRest = true;
                }
              }
              if(hasRest || next.size() > 2) {
                res += '.apply';
                prptHash[nid] = {
                  type: APPLY,
                  rest: hasRest,
                  size: next.size()
                };
                if(hasRest && next.size() > 3) {
                  ignore(rest.prev());
                }
              }
              else {
                res += '.call';
                prptHash[nid] = {
                  type: CALL,
                  rest: hasRest,
                  size: next.size()
                };
              }
            }
          }
        }
      }
    }
  }
  else {
    if(parent.name() == JsNode.ARGS
      && prev
      && prev.isToken()
      && prev.token().content() == 'super') {
      res += 'this';
      var list = node.next();
      if(list.size() > 2) {
        res += ',[';
      }
      else if(list.size() > 0) {
        res += ',';
      }
    }
    else if(prptHash[nid]) {
      var o = prptHash[nid];
      res += 'this';
      if(o.type == APPLY || o.size > 0) {
        res += ',';
        if(o.size > 2) {
          res += '[';
        }
      }
    }
  }
}

function supers(node) {
  ignore(node);
  var top = closest(node);
  var nid = top.nid();
  var o = hash[nid];
  res += o.extend;
  if(node.next()) {
    //super()
    if(node.next().name() == JsNode.ARGS) {
      var list = node.next().leaf(1);
      var hasRest = false;
      if(list.size() > 1) {
        var rest = list.last().prev();
        if(rest.isToken() && rest.token().content() == '...') {
          hasRest = true;
        }
      }
      if(hasRest || list.size() > 2) {
        res += '.apply';
        if(hasRest && list.size() > 3) {
          ignore(rest.prev());
        }
      }
      else {
        res += '.call';
      }
    }
    //super.xxx
    else {
      res += '.prototype';
    }
  }
}

function rest(node) {
  var parent = node.parent();
  if(parent.name() == JsNode.ARGLIST) {
    var len = parent.size();
    var args = parent.parent();
    if(args.name() == JsNode.ARGS) {
      var prev = args.prev();
      //super(...x)
      if(prev.isToken() && prev.token().content() == 'super') {
        ignore(node);
        if(len > 2) {
          res += '].concat(Array.from(';
        }
        else {
          res += 'Array.from(';
        }
      }
      //super.xxx(...x)
      else if(prptHash[parent.prev().nid()]) {
        ignore(node);
        if(len > 2) {
          res += '].concat(Array.from(';
        }
        else {
          res += 'Array.from(';
        }
      }
    }
  }
}

function rp(node) {
  var prev = node.prev();
  if(prev.name() == JsNode.ARGLIST) {
    var parent = node.parent();
    if(parent.name() == JsNode.ARGS) {
      var sup = parent.prev();
      //super()
      if(sup.isToken() && sup.token().content() == 'super') {
        if(prev.size() >= 2) {
          var rest = prev.last().prev();
          if(rest.token().content() != '...') {
            res += ']';
          }
          else {
            res += ')';
            if(prev.size() > 3) {
              res += ')';
            }
          }
        }
      }
      //super.xxx()
      else {
        var first = parent.first();
        var o = prptHash[first.nid()];
        if(o) {
          if(o.type == APPLY) {
            if(!o.rest) {
              res += ']';
            }
            else {
              res += ')';
              if(o.size > 3) {
                res += ')';
              }
            }
          }
        }
      }
    }
  }
}

function body(node, ids) {
  var parent = node.parent();
  if(parent.name() == JsNode.METHOD) {
    var first = parent.first();
    if(first.name() == JsNode.PROPTNAME) {
      first = first.first();
      if(first.name() == JsNode.LTRPROPT) {
        first = first.first();
        if(first.isToken() && first.token().content() == 'constructor') {
          var top = closest(parent);
          var o = hash[top.nid()];
          var news = getUid(ids);
          res += 'if(migi.browser.lie&&this.__migiCP){';
          res += 'return this.__hackLie(' + o.name + ',' + o.gsName + ')}';
        }
      }
    }
  }
}

function closest(node) {
  var parent = node;
  while(parent = parent.parent()) {
    if(parent.name() == JsNode.CLASSDECL
      || parent.name() == JsNode.CLASSEXPR) {
      return parent;
    }
  }
}

var res;

function klass(node, ids) {
  res = '';
  uid = 0;
  recursion(node, ids);
  return res;
}

exports["default"]=klass;});