var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("Tree")?_2.Tree:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function elem(node, cHash) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), cHash);
  for(var i = 1, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    switch(leaf.name()) {
      case Node.JSXChild:
        res += ',';
        res += child(leaf, cHash);
        break;
      case Node.TOKEN:
        var s = join(leaf);
        //open和close之间的空白不能忽略
        if(/^[\s]+$/.test(s)) {
          if(leaf.prev().name() == Node.JSXOpeningElement && leaf.next().name() == Node.JSXClosingElement) {
            res += ',';
            res += '"' + join(leaf).replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
          }
        }
        else {
          res += ',';
          res += '"' + join(leaf).replace(/"/g, '\\"').replace(/\n/g, '\\\n') + '"';
        }
        break;
      default:
        res += ',';
        res += parse(leaf, cHash);
    }
  }
  res += ')';
  return res;
}
function selfClose(node, cHash) {
  var res = '';
  var name = node.leaf(1).token().content();
  res += 'migi.createElement(';
  if (cHash.hasOwnProperty(name)) {
    res += name;
  }
  else {
    res += '"' + name + '"';
  }
  res += ',{';
  var first = true;
  var end = false;
  for(var i = 2, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    switch(leaf.name()) {
      case Node.JSXAttribute:
        if(!first) {
          res += ',';
        }
        first = false;
        res += attr(leaf);
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
function attr(node) {
  var res = '';
  var key = node.first().token().content();
  res += key + ':';
  var v = node.last();
  if(v.isToken()) {
    res += v.token().content();
  }
  else {
    res += join(v.leaf(1));
  }
  return res;
}
function spread(node) {
  //TODO
}
function child(node, cHash) {
  var tree = new Tree(cHash);
  var res = tree.parse(node);
  return res.slice(1, res.length - 1);
}

function parse(node, cHash) {
  //循环依赖fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree.default;
  }
  var res = '';
  switch(node.name()) {
    case Node.JSXElement:
      res += elem(node, cHash);
      break;
    case Node.JSXSelfClosingElement:
      res += selfClose(node, cHash);
      res += ')';
      break;
  }
  return res;
}

exports.default=parse;