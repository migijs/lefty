define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var Tree=function(){var _1=require('./Tree');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var InnerTree=function(){var _2=require('./InnerTree');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var linkage=function(){var _3=require('./linkage');return _3.hasOwnProperty("default")?_3["default"]:_3}();
var ignore=function(){var _4=require('./ignore');return _4.hasOwnProperty("default")?_4["default"]:_4}();
var join=function(){var _5=require('./join');return _5.hasOwnProperty("default")?_5["default"]:_5}();
var delegate=function(){var _6=require('./delegate');return _6.hasOwnProperty("default")?_6["default"]:_6}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function elem(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
  res += ',[';
  var comma = false;
  for(var i = 1, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    switch(leaf.name()) {
      case Node.JSXChild:
        if(comma) {
          res += ',';
          comma = false;
        }
        res += child(leaf, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
        comma = true;
        break;
      case Node.TOKEN:
        var s = leaf.token().content();
        //open和close之间的空白不能忽略
        if(/^\s+$/.test(s)) {
          if(leaf.prev().name() == Node.JSXOpeningElement && leaf.next().name() == Node.JSXClosingElement) {
            res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
          }
          else {
            res += s;
          }
        }
        else {
          if(comma) {
            res += ',';
            comma = false;
          }
          res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
          comma = true;
        }
        break;
      default:
        if(comma) {
          res += ',';
          comma = false;
        }
        res += parse(leaf, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
        comma = true;
    }
  }
  res += '])';
  if(node.last().name() == Node.JSXClosingElement) {
    res += ignore(node.last(), true).res;
  }
  return res;
}
function selfClose(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  var res = '';
  var name = node.leaf(1).token().content();
  if(/^[A-Z]/.test(name)) {
    res += 'migi.createCp(';
    res += name;
  }
  else {
    res += 'migi.createVd(';
    res += '"' + name + '"';
  }
  res += ',[';
  for(var i = 2, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    if(i != 2) {
      res += ',';
    }
    switch(leaf.name()) {
      case Node.JSXAttribute:
        res += attr(leaf, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.JSXSpreadAttribute:
        res += spread(leaf);
        break;
    }
  }
  res += ']';
  return res;
}
function attr(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  var res = '';
  var key = node.first().token().content();
  var k = '["' + key + '"';
  res += k + ',';
  var v = node.last();
  if(v.isToken()) {
    v = v.token().content();
    res += v;
  }
  else if(/^on[A-Z]/.test(key)) {
    res += onEvent(v, isBind);
  }
  else {
    res += child(v, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
  }
  res += ']';
  return res;
}
function onEvent(node, isBind) {
  var res = delegate(node, isBind);
  return res;
}
function spread(node) {
  return join(node.leaf(2));
}
function child(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  var tree = isBind ? new InnerTree(setHash, getHash, varHash, modelHash, thisHash, thisModelHash) : new Tree();
  var res = tree.parse(node);
  res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
  if(isBind) {
    var list = linkage(node.leaf(1), setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
    if(list.length == 1) {
      return 'new migi.Obj("' + list[0] + '",this,function(){return(' + res + ')})';
    }
    else if(list.length > 1) {
      return 'new migi.Obj(' + JSON.stringify(list) + ',this,function(){return(' + res + ')})';
    }
  }
  return res;
}

function parse(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  //循环依赖fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
  var res = '';
  switch(node.name()) {
    case Node.JSXElement:
      res += elem(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
      break;
    case Node.JSXSelfClosingElement:
      res += selfClose(node, isBind, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
      res += ')';
      break;
  }
  return res;
}

exports["default"]=parse;});