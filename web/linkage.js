define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res) {
  switch(node.name()) {
    case Node.PRMREXPR:
      parse(node.first(), res);
      break;
    case Node.MMBEXPR:
      mmbexpr(node, res);
      break;
    case Node.CNDTEXPR:
      parse(node.first(), res);
      parse(node.leaf(2), res);
      parse(node.last(), res);
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
      parse(node.first(), res);
      parse(node.last(), res);
      break;
    case Node.UNARYEXPR:
    case Node.NEWEXPR:
      parse(node.last(), res);
      break;
    case Node.POSTFIXEXPR:
      parse(node.first(), res);
    case Node.CALLEXPR:
      callexpr(node, res);
      break;
    case Node.ARRLTR:
      arrltr(node, res);
      break;
  }
}
function mmbexpr(node, res) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken()) {
      if(first.token().content() == 'this') {
        var dot = node.leaf(1);
        if(dot.isToken()) {
          if(dot.token().content() == '.') {
            var id = node.last().token().content();
            res[id] = true;
          }
          else if(dot.token().content() == '[') {
            var expr = dot.next();
            if(expr.name() == Node.EXPR) {
              parse(expr.last(), res);
            }
            else if(expr.name() == Node.PRMREXPR) {
              var s = expr.first();
              if(s.isToken()) {
                s = s.token();
                if(s.type() == Token.STRING) {
                  res[s.val()] = true;
                }
              }
            }
            else {
              parse(expr, res);
            }
          }
        }
      }
      else {
        var bracket = node.leaf(1);
        if(bracket.isToken()) {
          if(bracket.token().content() == '[') {
            var expr = bracket.next();
            if(expr.name() == Node.EXPR) {
              parse(expr.last(), res);
            }
            else {
              parse(expr, res);
            }
          }
        }
      }
    }
  }
  else if(prmr.name() == Node.MMBEXPR) {
    mmbexpr(prmr, res);
  }
}
function callexpr(node, res) {
  parse(node.first(), res);
  var args = node.last();
  if(args.name() == Node.ARGS) {
    args.leaf(1).leaves().forEach(function(leaf, i) {
      if(i % 2 == 0) {
        parse(leaf, res);
      }
    });
  }
}

function arrltr(node, res) {
  node.leaves().forEach(function(leaf, i) {
    if(i % 2 == 1) {
      if(!leaf.isToken()) {
        parse(leaf, res);
      }
    }
  });
}

exports["default"]=function(node, setHash, getHash) {
  var res = {};
  parse(node, res);
  //取得全部this.xxx后，判断是否有对应的set方法
  var arr = Object.keys(res).filter(function(item) {
    return setHash.hasOwnProperty(item);
  });
  Object.keys(res).forEach(function(item) {
    //如有get方法且显式声明形参依赖
    if(getHash.hasOwnProperty(item)
      && !({
        'children': true,
        'props': true,
        'element': true,
        'names': true,
        'style': true,
        'name': true,
        'parent': true,
        'uid': true,
        'dom': true,
        'html': true,
        'text': true,
        'virtualDom': true
      }.hasOwnProperty(item))) {
      var deps = getHash[item];
      deps.forEach(function(dep) {
        //声明的依赖需有set方法
        if(setHash.hasOwnProperty(dep) && arr.indexOf(dep) == -1) {
          arr.push(dep);
        }
      });
    }
  });
  return arr;
};});