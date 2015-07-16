var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
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
    if(!token.ignore) {
      res += token.content();
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      res += token.content();
    }
  }
  else {
    switch(node.name()) {
      case JsNode.CLASSDECL:
        decl(node, ids, true);
        break;
      case JsNode.CLASSELEM:
        elem(node, ids, true);
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

function elem(node, ids, start) {
  var first = node.first();
  var top = node.parent().parent();
  var tid = top.nid();
  var o = hash[tid];
  if(first.name() == JsNode.METHOD) {
    first = first.first();
    //method
    if(first.name() == JsNode.PROPTNAME) {
      if(start) {
        var token = first.first().first().token();
        ignore(token);
        if(token.content() == 'constructor') {
          res += 'function ';
          res += o.name;
        }
        else {
          res += o.name;
          res += '.prototype.' + token.content() + '=function';
        }
      }
    }
  }
}

var res;

function klass(node, hash) {
  res = '';
  recursion(node, hash);
  return res;
}

exports["default"]=klass;