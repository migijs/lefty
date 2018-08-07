import homunculus from 'homunculus';
import ignore from './ignore';
import Tree from './Tree';
import join from './join';
import join2 from './join2';
import jaw from 'jaw';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res = '';

function parse(node, param) {
  //循环依赖fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
  var prmr = node.leaf(1);
  if(prmr && prmr.name() == Node.PRMREXPR) {
    var objltr = prmr.first();
    if(objltr && objltr.name() == Node.OBJLTR) {
      res = ignore(node.first(), true).res + '[';
      recursion(objltr, param);
      res += ignore(node.last(), true).res + ']';
    }
    else {
      var tree = new Tree();
      res = tree.parse(node);
      res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
      res = filter(res, param);
    }
  }
  else {
    var tree = new Tree();
    res = tree.parse(node);
    res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
    res = filter(res, param);
  }
  return res;
}

function recursion(objltr, param) {
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
      s = jaw.parse(s, { noPriority: true, noValue: true, noMedia: true });
      res += JSON.stringify(s);
      res += ',';
      res += filter(join(leaf.last()), param);
      res += ']';
      res += ignore(leaf, true).res;
    }
  }
  res += ignore(objltr.last(), true).res;
}

function filter(s, param) {
  if(/^\s*this\b/.test(s) || /^\s*function\b/.test(s)) {
    return 'new migi.Cb(this,' + s + ')';
  }
  else if(param && param.thisHash && /^\s*[a-zA-Z]\w*\b/.test(s)) {
    var w = /^\s*([a-zA-Z]\w*)\b/.exec(s);
    if(param.thisHash.hasOwnProperty(w[1])) {
      return 'new migi.Cb(' + w[1] + ',' + s + ')';
    }
  }
  return s;
}

export default parse;