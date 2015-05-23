define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res) {
  switch(node.name()) {
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
  }
}
function mmbexpr(node, res) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken() && first.token().content() == 'this') {
      var dot = node.leaf(1);
      if(dot.isToken()) {
        if(dot.token().content() == '.') {
          var id = node.last().token().content();
          if(!{
              children: true
            }.hasOwnProperty(id)) {
            res[id] = true;
          }
        }
        else if(dot.token().content() == '[') {
          var expr = dot.next();
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

exports.default=function(node, setHash, getHash) {
  var res = {};
  parse(node, res);console.log(res, setHash, getHash)
  //取得全部this.xxx后，判断是否有对应的set方法
  var arr = Object.keys(res).filter(function(item) {
    return setHash.hasOwnProperty(item);
  });
  Object.keys(res).forEach(function(item) {
    //如有get方法且显式声明形参依赖
    if(getHash.hasOwnProperty(item)) {
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