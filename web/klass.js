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

function recursion(node, ids) {
  var isToken = node.name() == JsNode.TOKEN;
  if(isToken) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    var s = token.content();
    if(s == '(') {
      prpts(node, true);
    }
    if(!token.ignore) {
      res += s;
    }
    if(s == '(') {
      prpts(node);
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
    res += 'if(!migi.lie){';
    res += 'Object.definePropertyies(';
    res += o.name + '.prototype,';
    res += o.gsName + ')}';
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
  if(start) {
    if(parent.name() == JsNode.METHOD
      && parent.prev()
      && parent.prev().name() == JsNode.TOKEN
      && parent.prev().token().content() == 'static') {
      if(parent.first().name() == JsNode.TOKEN
        && ['get', 'set'].indexOf(parent.first().token().content()) > -1) {
        return;
      }
      parent = parent.parent();
      if(parent.name() == JsNode.CLASSELEM) {
        res += '=function';
      }
    }
  }
}

var res;

function klass(node, ids) {
  res = '';
  recursion(node, ids);
  return res;
}

exports["default"]=klass;});