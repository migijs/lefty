import homunculus from 'homunculus';
import Tree from './Tree';
import linkage from './linkage';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function elem(node, inClass, inRender, setHash, getHash) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), inClass, inRender, setHash, getHash);
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
        res += child(leaf, inClass, inRender, setHash, getHash);
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
        res += parse(leaf, inClass, inRender, setHash, getHash);
        comma = true;
    }
  }
  res += '])';
  if(node.last().name() == Node.JSXClosingElement) {
    res += ignore(node.last(), true).res;
  }
  return res;
}
function selfClose(node, inClass, inRender, setHash, getHash) {
  var res = '';
  var name = node.leaf(1).token().content();
  if(/^[A-Z]/.test(name)) {
    res += 'migi.createCp(';
    res += '"' + name + '",';
    res += name;
  }
  else {
    res += 'migi.createVd(';
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
  var k = key.indexOf('-') > 0 ? "'" + key + "'" : key;
  res += k + ':';
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

export default parse;