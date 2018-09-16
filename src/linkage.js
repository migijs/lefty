import homunculus from 'homunculus';
import arrowfn from './arrowfn';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

function parse(node, res, param, opt) {
  if(node.isToken()) {
  }
  else {
    switch(node.name()) {
      case Node.EXPR:
        parse(node.first(), res, param, opt);
        //可能有连续多个表达式
        for(let i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param, opt);
        }
        break;
      case Node.PRMREXPR:
        parse(node.first(), res, param, opt);
        break;
      case Node.MMBEXPR:
        mmbexpr(node, res, param, opt);
        break;
      case Node.CNDTEXPR:
        parse(node.first(), res, param, opt);
        parse(node.leaf(2), res, param, opt);
        parse(node.last(), res, param, opt);
        break;
      case Node.LOGOREXPR:
      case Node.LOGANDEXPR:
      case Node.BITANDEXPR:
      case Node.BITOREXPR:
      case Node.BITXOREXPR:
      case Node.EQEXPR:
      case Node.RELTEXPR:
      case Node.SHIFTEXPR:
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        parse(node.first(), res, param, opt);
        //可能有连续多个表达式
        for(let i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param, opt);
        }
        break;
      case Node.UNARYEXPR:
      case Node.NEWEXPR:
        parse(node.last(), res, param, opt);
        break;
      case Node.POSTFIXEXPR:
        parse(node.first(), res, param, opt);
        break;
      case Node.CALLEXPR:
        callexpr(node, res, param, opt);
        break;
      case Node.ARRLTR:
        arrltr(node, res, param, opt);
        break;
      case Node.CPEAPL:
        cpeapl(node, res, param, opt);
        break;
      case Node.ARGS:
        parse(node.leaf(1), res, param, opt);
        break;
      case Node.ARGLIST:
      case Node.TEMPLATE:
        for(let i = 0, leaves = node.leaves(), len = leaves.length; i < len; i++) {
          let leaf = node.leaf(i);
          if(!leaf.isToken()) {
            parse(leaf, res, param, opt);
          }
        }
        break;
      case Node.ARROWFN:
        opt.arrowFn = opt.arrowFn || [];
        let temp = node.parent();
        if(temp && temp.name() === Node.ARGLIST) {
          temp = temp.parent();
          if(temp && temp.name() === Node.ARGS) {
            temp = temp.prev();
            if(temp && temp.name() === Node.MMBEXPR) {
              let callexpr = temp.parent();
              temp = temp.leaf(2);
              if(temp.isToken() && temp.token().content() === 'map') {
                let body = node.last().leaf(1);
                if(opt.arrowFn.length === 0) {
                  opt.arrowFn.push(true);
                }
                else {
                  opt.arrowFn.push(callexpr.parent().name() === Node.RETSTMT);
                }
                arrowfn(body, res, param, opt);
                opt.arrowFn.pop();
              }
            }
          }
        }
        break;
      case Node.JSXElement:
        parse(node.first(), res, param, opt);
        for(let i = 1, leaves = node.leaves(); i < leaves.length - 1; i++) {
          parse(leaves[i], res, param, opt);
        }
        break;
      case Node.JSXSelfClosingElement:
      case Node.JSXOpeningElement:
        for(let i = 1, leaves = node.leaves(); i < leaves.length - 1; i++) {
          parse(leaves[i], res, param, opt);
        }
        break;
      case Node.JSXAttribute:
        let value = node.last();
        if(value.name() === Node.JSXAttributeValue) {
          let first = value.first();
          if(first.isToken() && first.token().content() === '{') {
            parse(value.leaf(1), res, param, opt);
          }
        }
        break;
      case Node.JSXChild:
        node.leaves().forEach((leaf) => {
          parse(leaf, res, param, opt);
        });
        break;
    }
  }
}
function mmbexpr(node, res, param, opt) {
  let prmr = node.first();
  if(prmr.name() === Node.PRMREXPR) {
    let first = prmr.first();
    if(first.isToken()) {
      let me = first.token().content();
      if(me === 'this') {
        let dot = node.leaf(1);
        if(dot.isToken()) {
          if(dot.token().content() === '.') {
            let token = dot.next();
            let id = token.token().content();
            if(id === 'model') {
              if(node.name() === Node.MMBEXPR) {
                let next = node.next();
                if(next.isToken()) {
                  if(next.token().content() === '.') {
                    next = next.next();
                    if(next.isToken()) {
                      let token = next.token();
                      res['model.' + token.content()] = true;
                    }
                  }
                  else if(next.token().content() === '[') {
                    let expr = next.next();
                    if(expr.name() === Node.PRMREXPR) {
                      let s = expr.first();
                      if(s.isToken()) {
                        s = s.token();
                        if(s.type() === Token.STRING) {
                          res['model.' + s.val()] = true;
                        }
                      }
                    }
                  }
                }
              }
            }
            else {
              res[id] = true;
            }
          }
          else if(dot.token().content() === '[') {
            let expr = dot.next();
            if(expr.name() === Node.EXPR) {
              parse(expr.last(), res, param, opt);
            }
            else if(expr.name() === Node.PRMREXPR) {
              let s = expr.first();
              if(s.isToken()) {
                s = s.token();
                if(s.type() === Token.STRING) {
                  res[s.val()] = true;
                }
              }
            }
            else {
              parse(expr, res, param, opt);
            }
          }
        }
      }
      else {
        let bracket = node.leaf(1);
        if(bracket.isToken()) {
          if(bracket.token().content() === '[') {
            let expr = bracket.next();
            if(expr.name() === Node.EXPR) {
              parse(expr.last(), res, param, opt);
            }
            else {
              parse(expr, res, param, opt);
            }
          }
        }
      }
    }
    else {
      parse(first, res, param, opt);
    }
  }
  else if(prmr.name() === Node.MMBEXPR) {
    mmbexpr(prmr, res, param, opt);
    let dot = prmr.next();
    if(dot.isToken() && dot.token().content() === '[') {
      let expr = dot.next();
      if(expr.name() === Node.EXPR) {
        parse(expr.last(), res, param, opt);
      }
      else if(expr.name() === Node.PRMREXPR) {
        let s = expr.first();
        if(s.isToken()) {
          s = s.token();
          if(s.type() === Token.STRING) {
            res[s.val()] = true;
          }
        }
      }
      else {
        parse(expr, res, param, opt);
      }
    }
  }
  else {
    parse(prmr, res, param, opt);
  }
}
function callexpr(node, res, param, opt) {
  parse(node.first(), res, param, opt);
  let args = node.last();
  if(args.name() === Node.ARGS) {
    args.leaf(1).leaves().forEach(function(leaf, i) {
      if(i % 2 === 0) {
        parse(leaf, res, param, opt);
      }
    });
  }
}

function arrltr(node, res, param, opt) {
  node.leaves().forEach(function(leaf, i) {
    if(i % 2 === 1) {
      if(!leaf.isToken()) {
        parse(leaf, res, param, opt);
      }
    }
  });
}

function cpeapl(node, res, param, opt) {
  if(node.size() > 2) {
    let leaf = node.leaf(1);
    if(!leaf.isToken()) {
      parse(leaf, res, param, opt);
    }
  }
}

export default function(node, param, opt) {
  let res = {};
  // 取得全部this.xxx
  parse(node, res, param, opt);
  let arr = Object.keys(res);
  arr = arr.filter(function(item) {
    //model.xxx全部通过
    if(item.indexOf('model.') === 0) {
      return true;
    }
    //没get不通过
    if(!(param.getHash || {}).hasOwnProperty(item)) {
      return false;
    }
    //有get需要有bind或link
    return (param.bindHash || {}).hasOwnProperty(item) || (param.evalHash || {}).hasOwnProperty(item) || (param.linkHash || {}).hasOwnProperty(item);
  });
  // 因特殊Array优化需要，this.v或者(..., this.v)形式的侦听变量
  // see https://github.com/migijs/migi/issues/29
  let single = false;
  if(node.name() === Node.MMBEXPR
    && node.leaves().length === 3
    && node.first().name() === Node.PRMREXPR) {
    single = arr.length === 1
      && node.first().first().isToken()
      && node.first().first().token().content() === 'this'
      && node.last().isToken()
      && node.last().token().content() === arr[0];
  }
  else if(node.name() === Node.MMBEXPR
    && node.leaves().length === 3
    && node.first().name() === Node.MMBEXPR
    && node.first().leaves().length === 3
    && node.first().first().name() === Node.PRMREXPR) {
    single = arr.length === 1
      && node.first().first().first().isToken()
      && node.first().first().first().token().content() === 'this'
      && node.first().last().isToken()
      && node.first().last().token().content() === 'model'
      && node.last().isToken()
      && node.last().token().content() === arr[0].slice(6);
  }
  else if(node.name() === Node.PRMREXPR
    && node.first().name() === Node.CPEAPL) {
    let cpeapl = node.first();
    if(cpeapl.leaves().length === 3
      && cpeapl.leaf(1).name() === Node.EXPR) {
      let expr = cpeapl.leaf(1);
      if(expr.last().name() === Node.MMBEXPR) {
        let mmbexpr = expr.last();
        if(mmbexpr.leaves().length === 3
          && mmbexpr.first().name() === Node.PRMREXPR
          && mmbexpr.last().isToken()) {
          single = arr.length
            && mmbexpr.first().first().isToken()
            && mmbexpr.first().first().token().content() === 'this'
            && mmbexpr.last().token().content() === arr[arr.length - 1];
        }
      }
    }
    else if(cpeapl.leaves().length === 3
      && cpeapl.leaf(1).name() === Node.MMBEXPR
      && cpeapl.first().isToken()
      && cpeapl.first().token().content() === '(') {
      let mmbexpr = cpeapl.leaf(1);
      if(mmbexpr.leaves().length === 3
        && mmbexpr.first().name() === Node.PRMREXPR
        && mmbexpr.last().isToken()) {
        single = arr.length
          && mmbexpr.first().first().isToken()
          && mmbexpr.first().first().token().content() === 'this'
          && mmbexpr.last().token().content() === arr[arr.length - 1];
      }
    }
  }
  return {
    arr,
    single,
  };
};
