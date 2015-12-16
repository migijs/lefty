define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var join=function(){var _3=require('./join');return _3.hasOwnProperty("default")?_3["default"]:_3}();
var join2=function(){var _4=require('./join2');return _4.hasOwnProperty("default")?_4["default"]:_4}();
var jaw=function(){var _5=require('jaw');return _5.hasOwnProperty("default")?_5["default"]:_5}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res = '';

function parse(node, inClass, inRender) {
  //循环依赖fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
  if(inClass && inRender) {
    var prmr = node.leaf(1);
    if(prmr && prmr.name() == Node.PRMREXPR) {
      var objltr = prmr.first();
      if(objltr && objltr.name() == Node.OBJLTR) {
        res = ignore(node.first(), true).res + '[';
        recursion(objltr);
        res += ignore(node.last(), true).res + ']';
      }
      else {
        var tree = new Tree();
        res = tree.parse(node);
        res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
        res = filter(res);
      }
    }
    else {
      var tree = new Tree();
      res = tree.parse(node);
      res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
      res = filter(res);
    }
  }
  else {
    var tree = new Tree();
    res = tree.parse(node);
    res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
  }
  return res;
}

function recursion(objltr) {
  res += ignore(objltr.first(), true).res;
  for(var i = 1, len = objltr.size(); i < len - 1; i++) {
    var leaf = objltr.leaf(i);
    if(leaf.isToken()) {
      var s = join2(leaf);
      res += s;
    }
    else if(leaf.name() == Node.PROPTDEF) {
      res += '[';
      var proptname = leaf.first();
      var s = join(proptname).replace(/^(["'])(.+)\1$/, '$2') + '{}';
      s = jaw.parse(s, { noPriority: true }).default;
      res += JSON.stringify(s);
      res += ',';
      res += filter(join(leaf.last()));
      res += ']';
      res += ignore(leaf, true).res;
    }
  }
  res += ignore(objltr.last(), true).res;
}

function filter(s) {
  if(/^this\s*\.\s*model\b/.test(s)) {
    return 'new migi.Cb(this.model,' + s + ')';
  }
  else if(/^\s*this\b/.test(s)) {
    return 'new migi.Cb(this,' + s + ')';
  }
  return s;
}

exports["default"]=parse;});