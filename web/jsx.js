define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0["default"]:_0}();
var Tree=function(){var _1=require('./Tree');return _1.hasOwnProperty("Tree")?_1.Tree:_1.hasOwnProperty("default")?_1["default"]:_1}();
var linkage=function(){var _2=require('./linkage');return _2.hasOwnProperty("linkage")?_2.linkage:_2.hasOwnProperty("default")?_2["default"]:_2}();
var join=function(){var _3=require('./join');return _3.hasOwnProperty("join")?_3.join:_3.hasOwnProperty("default")?_3["default"]:_3}();
var ignore=function(){var _4=require('./ignore');return _4.hasOwnProperty("ignore")?_4.ignore:_4.hasOwnProperty("default")?_4["default"]:_4}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function elem(node, inClass, inRender, setHash, getHash) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), inClass, inRender, setHash, getHash);
  for(var i = 1, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    switch(leaf.name()) {
      case Node.JSXChild:
        res += ',';
        res += child(leaf, inClass, inRender, setHash, getHash);
        break;
      case Node.TOKEN:
        var s = join(leaf);
        //open和close之间的空白不能忽略
        if(/^[\s]+$/.test(s)) {
          if(leaf.prev().name() == Node.JSXOpeningElement && leaf.next().name() == Node.JSXClosingElement) {
            res += ',';
            res += '"' + join(leaf).replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
          }
          else {
            res += join(leaf);
          }
        }
        //节点间的空白直接追加
        else {
          res += ',';
          res += '"' + join(leaf).replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
        }
        break;
      default:
        res += ',';
        res += parse(leaf, inClass, inRender, setHash, getHash);
    }
  }
  res += ')';
  if(node.last().name() == Node.JSXClosingElement) {
    res += ignore(node.last()).res;
  }
  return res;
}
function selfClose(node, inClass, inRender, setHash, getHash) {
  var res = '';
  var name = node.leaf(1).token().content();
  res += 'migi.createElement(';
  if(/^[A-Z]/.test(name)) {
    res += name;
  }
  else {
    res += '"' + name + '"';
  }
  res += ',{';
  var end = false;
  for(var i = 2, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    if(i != 2) {
      res += ',';
    }
    switch(leaf.name()) {
      case Node.JSXAttribute:
        res += attr(leaf, inClass, inRender, setHash, getHash);
        break;
      case Node.JSXSpreadAttribute:
        res += '}';
        end = true;
        res += spread(leaf);
        break;
    }
  }
  if(!end) {
    res += '}';
  }
  return res;
}
function attr(node, inClass, inRender, setHash, getHash) {
  var res = '';
  var key = node.first().token().content();
  res += key + ':';
  var v = node.last();
  if(v.isToken()) {
    v = v.token().content();
    res += v;
  }
  else if(/^on[A-Z]/.test(key)) {
    res += onEvent(v, inClass, inRender);
  }
  else {
    res += child(v, inClass, inRender, setHash, getHash);
  }
  return res;
}
function onEvent(node, inClass, inRender) {
  var tree = new Tree();
  var res = tree.parse(node);
  res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
  if(/^\s*this\b/.test(res) && inClass && inRender) {
    return 'new migi.Cb(this,' + res + ')';
  }
  return res;
}
function spread(node) {
  //TODO
}
function child(node, inClass, inRender, setHash, getHash) {
  var tree = new Tree();
  var res = tree.parse(node);
  res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
  var list = linkage(node.leaf(1), setHash, getHash);
  if(list.length && inClass && inRender) {
    if(list.length == 1) {
      return 'new migi.Obj("' + list[0] + '",this,function(){return(' + res + ')})';
    }
    else {
      return 'new migi.Obj(' + JSON.stringify(list) + ',this,function(){return(' + res + ')})';
    }
  }
  return res;
}

function parse(node, inClass, inRender, setHash, getHash) {
  //循环依赖fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
  var res = '';
  switch(node.name()) {
    case Node.JSXElement:
      res += elem(node, inClass, inRender, setHash, getHash);
      break;
    case Node.JSXSelfClosingElement:
      res += selfClose(node, inClass, inRender, setHash, getHash);
      res += ')';
      break;
  }
  return res;
}

exports["default"]=parse;});