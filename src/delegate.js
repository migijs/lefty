import homunculus from 'homunculus';
import ignore from './ignore';
import InnerTree from './InnerTree';
import join from './join';
import join2 from './join2';
import jaw from 'jaw';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

let S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

let res = '';

function parse(node) {
  let prmr = node.leaf(1);
  if(prmr && prmr.name() === Node.PRMREXPR) {
    let objltr = prmr.first();
    if(objltr && objltr.name() === Node.OBJLTR) {
      res = ignore(node.first(), true).res + '[';
      recursion(objltr);
      res += ignore(node.last(), true).res + ']';
    }
    else {
      let tree = new InnerTree();
      res = tree.parse(node);
      res = res.replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1');
      res = filter(res);
    }
  }
  else {
    let tree = new InnerTree();
    res = tree.parse(node);
    res = res.replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1');
    res = filter(res);
  }
  return res;
}

function recursion(objltr) {
  res += ignore(objltr.first(), true).res;
  for(let i = 1, len = objltr.size(); i < len - 1; i++) {
    let leaf = objltr.leaf(i);
    if(leaf.isToken()) {
      let s = join2(leaf);
      res += s;
    }
    else if(leaf.name() === Node.PROPTDEF) {
      res += '[';
      let proptname = leaf.first();
      let s = join(proptname).replace(/^(["'])(.+)\1$/, '$2') + '{}';
      s = jaw.parse(s, { noPriority: true, noValue: true, noMedia: true });
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
  if(/^\s*this\b/.test(s) || /^\s*function\b/.test(s)) {
    if(/^\s*this\s*\.\s*model\s*\./.test(s)) {
      return 'new migi.Cb(this.model,' + s + ')';
    }
    return 'new migi.Cb(this,' + s + ')';
  }
  return s;
}

export default parse;