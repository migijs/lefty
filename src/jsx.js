import homunculus from 'homunculus';
import Tree from './Tree';
import linkage from './linkage';
import join from './join';
import ignore from './ignore';

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
        res += parse(leaf, cHash);
    }
  }
  res += ')';
  if(node.last().name() == Node.JSXClosingElement) {
    res += ignore(node.last()).res;
  }
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
  var end = false;
  for(var i = 2, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    if(i != 2) {
      res += ',';
    }
    switch(leaf.name()) {
      case Node.JSXAttribute:
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
    v = v.token().content();
    res += v;
  }
  else {
    v = join(v.leaf(1));
    if(/^on[A-Z]/.test(key)) {
      res += v;
    }
    else {
      res += 'new migi.Obj("' + v.replace(/"/g, '\\"') + '",' + v + ')';
    }
  }
  return res;
}
function spread(node) {
  //TODO
}
function child(node, cHash) {
  var tree = new Tree(cHash);
  var res = tree.parse(node);
  res = res.slice(1, res.length - 1);
  var list = linkage(node.leaf(1));
  if(list.length) {
    if(list.length == 1) {
      return 'new migi.Obj("' + list[0] + '",' + res + ')';
    }
    else {
      return 'new migi.Obj(' + JSON.stringify(list) + ',' + res + ')';
    }
  }
  return res;
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

export default parse;