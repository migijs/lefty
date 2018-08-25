import homunculus from 'homunculus';
import InnerTree from './InnerTree';
import linkage from './linkage';
import ignore from './ignore';
import join from './join';
import delegate from './delegate';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

function elem(node, opt, param) {
  let res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), opt, param);
  res += ',[';
  let comma = false;
  for(let i = 1, len = node.size(); i < len - 1; i++) {
    let leaf = node.leaf(i);
    switch(leaf.name()) {
      case Node.JSXChild:
        if(comma) {
          res += ',';
          comma = false;
        }
        res += child(leaf, opt, param);
        comma = true;
        break;
      case Node.TOKEN:
        let s = leaf.token().content();
        //open和close之间的空白不能忽略
        if(/^\s+$/.test(s)) {
          if(leaf.prev().name() === Node.JSXOpeningElement && leaf.next().name() === Node.JSXClosingElement) {
            res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\n\\\n') + '"';
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
          res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\n\\\n') + '"';
          comma = true;
        }
        break;
      default:
        if(comma) {
          res += ',';
          comma = false;
        }
        res += parse(leaf, opt, param);
        comma = true;
    }
  }
  res += '])';
  if(node.last().name() === Node.JSXClosingElement) {
    res += ignore(node.last(), true).res;
  }
  return res;
}
function selfClose(node, opt, param) {
  let res = '';
  let name;
  let first = node.leaf(1);
  if(first.isToken()) {
    name = first.token().content();
  }
  else if(first.name() === Node.JSXMemberExpression) {
    name = first.first().token().content();
    for(let i = 1, len = first.size(); i < len; i++) {
      name += first.leaf(i).token().content();
    }
  }
  let isCp;
  if(/^[A-Z]/.test(name)) {
    isCp = true;
    res += 'migi.createCp(';
    res += name;
  }
  else {
    res += 'migi.createVd(';
    res += '"' + name + '"';
  }
  res += ',[';
  for(let i = 2, len = node.size(); i < len - 1; i++) {
    let leaf = node.leaf(i);
    if(i !== 2) {
      res += ',';
    }
    switch(leaf.name()) {
      case Node.JSXBindAttribute:
        res += attr(leaf, opt, param);
        break;
      case Node.JSXAttribute:
        res += attr(leaf, opt, param);
        break;
      case Node.JSXSpreadAttribute:
        res += spread(leaf);
        break;
    }
  }
  res += ']';
  return res;
}
function attr(node, opt, param) {
  let res = '';
  let key = node.first().token().content();
  let name = node.parent().leaf(1).token().content();
  let isCp = /^[A-Z]/.test(name);
  if(key.charAt(0) === '@') {
    key = key.slice(1);
  }
  // 组件属性非@申明均不bind
  else if(isCp && opt.isBind) {
    opt.isBind = false;
  }
  let k = '["' + key + '"';
  res += k + ',';
  let v = node.last();
  if(v.isToken()) {
    v = v.token().content();
    res += v;
  }
  else if(/^on-?[a-zA-Z]/.test(key)) {
    res += onEvent(v, opt, param);
  }
  else {
    res += child(v, opt, param, true);
  }
  res += ']';
  return res;
}
function onEvent(node, opt, param) {
  return delegate(node, param);
}
function spread(node) {
  return join(node.leaf(2));
}
function child(node, opt, param, isAttr) {
  // 初次进arrowFn标识isArrowFn，且在innerTree中isInArrowFn；再次进入时识别出来
  let callexpr = node.leaf(1);
  // if(callexpr.name() === Node.CALLEXPR
  //   && callexpr.first().name() === Node.MMBEXPR
  //   && callexpr.first().last().isToken()
  //   && callexpr.first().last().token().content() === 'map'
  //   && callexpr.last().leaf(1).first()
  //   && callexpr.last().leaf(1).first().name() === Node.ARROWFN) {
  //   opt.arrowFn = opt.arrowFn || [];
  // }
  if(opt.isBind) {
    let temp = linkage(callexpr, param, {
      arrowFn: opt.arrowFn,
    });
    let list = temp.arr;
    let single = temp.single;
    if(list.length === 1) {
      return 'new migi.Obj("'
        + list[0]
        + '",this,function(){return('
        + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
        + ')}'
        + (single ? ',true' : '')
        + ')';
    }
    else if(list.length > 1) {
      return 'new migi.Obj('
        + JSON.stringify(list)
        + ',this,function(){return('
        + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
        + ')}'
        + (single ? ',true' : '')
        + ')';
    }
  }
  // Obj中再次出现的:input的value还需要添加Obj
  else if(opt.isInBind) {
    if(isAttr) {
      let key = node.prev().prev().token().content();
      if(key === 'value') {
        let tag = node.parent().parent().leaf(1).token().content();
        if(tag === 'input' || tag === 'select') {
          let temp = linkage(callexpr, param, {
            arrowFn: opt.arrowFn,
          });
          let list = temp.arr;
          if(list.length === 1) {
            return 'new migi.Obj("'
              + list[0]
              + '",this,function(){return('
              + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
              + ')})';
          }
          else if(list.length > 1) {
            return 'new migi.Obj('
              + JSON.stringify(list)
              + ',this,function(){return('
              + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
              + ')})';
          }
        }
      }
    }
    else {
      let key = node.prev().leaf(1).token().content();
      if(key === 'textarea') {
        let temp = linkage(callexpr, param, {
          arrowFn: opt.arrowFn,
        });
        let list = temp.arr;
        if(list.length === 1) {
          return 'new migi.Obj("'
            + list[0]
            + '",this,function(){return('
            + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
            + ')})';
        }
        else if(list.length > 1) {
          return 'new migi.Obj('
            + JSON.stringify(list)
            + ',this,function(){return('
            + new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
            + ')})';
        }
      }
    }
  }
  return new InnerTree(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1');
}

function parse(node, opt, param) {
  let res = '';
  switch(node.name()) {
    case Node.JSXElement:
      res += elem(node, opt, param);
      break;
    case Node.JSXSelfClosingElement:
      res += selfClose(node, opt, param);
      res += ')';
      break;
  }
  return res;
}

export default parse;