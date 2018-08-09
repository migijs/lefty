define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (node, param) {
  var res = {};
  // 取得全部this.xxx
  parse(node, res, param);
  var arr = Object.keys(res);
  arr = arr.filter(function (item) {
    //model.xxx全部通过
    if (item.indexOf('model.') == 0) {
      return true;
    }
    //没get不通过
    if (!(param.getHash || {}).hasOwnProperty(item)) {
      return false;
    }
    //有get需要有bind或link
    return (param.bindHash || {}).hasOwnProperty(item) || (param.linkHash || {}).hasOwnProperty(item);
  });
  // 因特殊Array优化需要，this.v或者(..., this.v)形式的侦听变量
  // see https://github.com/migijs/migi/issues/29
  var single = false;
  if (node.name() == Node.MMBEXPR && node.leaves().length == 3 && node.first().name() == Node.PRMREXPR) {
    single = arr.length == 1 && node.first().first().isToken() && node.first().first().token().content() == 'this' && node.last().isToken() && node.last().token().content() == arr[0];
  } else if (node.name() == Node.PRMREXPR && node.first().name() == Node.CPEAPL) {
    var cpeapl = node.first();
    if (cpeapl.leaves().length == 3 && cpeapl.leaf(1).name() == Node.EXPR) {
      var expr = cpeapl.leaf(1);
      if (expr.last().name() == Node.MMBEXPR) {
        var mmbexpr = expr.last();
        if (mmbexpr.leaves().length == 3 && mmbexpr.first().name() == Node.PRMREXPR && mmbexpr.last().isToken()) {
          single = arr.length && mmbexpr.first().first().isToken() && mmbexpr.first().first().token().content() == 'this' && mmbexpr.last().token().content() == arr[arr.length - 1];
        }
      }
    } else if (cpeapl.leaves().length == 3 && cpeapl.leaf(1).name() == Node.MMBEXPR && cpeapl.first().isToken() && cpeapl.first().token().content() == '(') {
      var mmbexpr = cpeapl.leaf(1);
      if (mmbexpr.leaves().length == 3 && mmbexpr.first().name() == Node.PRMREXPR && mmbexpr.last().isToken()) {
        single = arr.length && mmbexpr.first().first().isToken() && mmbexpr.first().first().token().content() == 'this' && mmbexpr.last().token().content() == arr[arr.length - 1];
      }
    }
  }
  return {
    arr: arr,
    single: single
  };
};

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _arrowfn = require('./arrowfn');

var _arrowfn2 = _interopRequireDefault(_arrowfn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

function parse(node, res, param) {
  if (node.isToken()) {} else {
    switch (node.name()) {
      case Node.EXPR:
        parse(node.first(), res, param);
        //可能有连续多个表达式
        for (var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param);
        }
        break;
      case Node.PRMREXPR:
        parse(node.first(), res, param);
        break;
      case Node.MMBEXPR:
        mmbexpr(node, res, param);
        break;
      case Node.CNDTEXPR:
        parse(node.first(), res, param);
        parse(node.leaf(2), res, param);
        parse(node.last(), res, param);
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
        parse(node.first(), res, param);
        //可能有连续多个表达式
        for (var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param);
        }
        break;
      case Node.UNARYEXPR:
      case Node.NEWEXPR:
        parse(node.last(), res, param);
        break;
      case Node.POSTFIXEXPR:
        parse(node.first(), res, param);
        break;
      case Node.CALLEXPR:
        callexpr(node, res, param);
        break;
      case Node.ARRLTR:
        arrltr(node, res, param);
        break;
      case Node.CPEAPL:
        cpeapl(node, res, param);
        break;
      case Node.ARGS:
        parse(node.leaf(1), res, param);
        break;
      case Node.ARGLIST:
        for (var i = 0, leaves = node.leaves(), len = leaves.length; i < len; i++) {
          var leaf = node.leaf(i);
          if (!leaf.isToken()) {
            parse(leaf, res, param);
          }
        }
        break;
      case Node.ARROWFN:
        var temp = node.parent();
        if (temp && temp.name() == Node.ARGLIST) {
          temp = temp.parent();
          if (temp && temp.name() == Node.ARGS) {
            temp = temp.prev();
            if (temp && temp.name() == Node.MMBEXPR) {
              temp = temp.leaf(2);
              if (temp.isToken() && temp.token().content() == 'map') {
                var body = node.last().leaf(1);
                (0, _arrowfn2.default)(body, res, param);
              }
            }
          }
        }
        break;
      case Node.JSXElement:
        parse(node.first(), res, param);
        for (var i = 1, leaves = node.leaves(); i < leaves.length - 1; i++) {
          parse(leaves[i], res, param);
        }
        break;
      case Node.JSXSelfClosingElement:
      case Node.JSXOpeningElement:
        for (var i = 1, leaves = node.leaves(); i < leaves.length - 1; i++) {
          parse(leaves[i], res, param);
        }
        break;
      case Node.JSXAttribute:
        var value = node.last();
        if (value.name() == Node.JSXAttributeValue) {
          var first = value.first();
          if (first.isToken() && first.token().content() == '{') {
            parse(value.leaf(1), res, param);
          }
        }
        break;
      case Node.JSXChild:
        node.leaves().forEach(function (leaf) {
          parse(leaf, res, param);
        });
        break;
    }
  }
}
function mmbexpr(node, res, param) {
  var prmr = node.first();
  if (prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if (first.isToken()) {
      var me = first.token().content();
      if (me == 'this') {
        var dot = node.leaf(1);
        if (dot.isToken()) {
          if (dot.token().content() == '.') {
            var id = dot.next().token().content();
            if (id == 'model') {
              if (node.name() == Node.MMBEXPR) {
                var next = node.next();
                if (next.isToken()) {
                  if (next.token().content() == '.') {
                    next = next.next();
                    if (next.isToken()) {
                      var token = next.token();
                      res['model.' + token.content()] = true;
                    }
                  } else if (next.token().content() == '[') {
                    var expr = next.next();
                    if (expr.name() == Node.PRMREXPR) {
                      var s = expr.first();
                      if (s.isToken()) {
                        s = s.token();
                        if (s.type() == Token.STRING) {
                          res['model.' + s.val()] = true;
                        }
                      }
                    }
                  }
                }
              }
            } else {
              res[id] = true;
            }
          } else if (dot.token().content() == '[') {
            var expr = dot.next();
            if (expr.name() == Node.EXPR) {
              parse(expr.last(), res, param);
            } else if (expr.name() == Node.PRMREXPR) {
              var s = expr.first();
              if (s.isToken()) {
                s = s.token();
                if (s.type() == Token.STRING) {
                  res[s.val()] = true;
                }
              }
            } else {
              parse(expr, res, param);
            }
          }
        }
      } else {
        var bracket = node.leaf(1);
        if (bracket.isToken()) {
          if (bracket.token().content() == '[') {
            var expr = bracket.next();
            if (expr.name() == Node.EXPR) {
              parse(expr.last(), res, param);
            } else {
              parse(expr, res, param);
            }
          }
        }
      }
    } else if (first.name() == Node.CPEAPL) {
      parse(first, res, param);
    }
  } else if (prmr.name() == Node.MMBEXPR) {
    mmbexpr(prmr, res, param);
    var dot = prmr.next();
    if (dot.isToken() && dot.token().content() == '[') {
      var expr = dot.next();
      if (expr.name() == Node.EXPR) {
        parse(expr.last(), res, param);
      } else if (expr.name() == Node.PRMREXPR) {
        var s = expr.first();
        if (s.isToken()) {
          s = s.token();
          if (s.type() == Token.STRING) {
            res[s.val()] = true;
          }
        }
      } else {
        parse(expr, res, param);
      }
    }
  } else {
    parse(prmr, res, param);
  }
}
function callexpr(node, res, param) {
  parse(node.first(), res, param);
  var args = node.last();
  if (args.name() == Node.ARGS) {
    args.leaf(1).leaves().forEach(function (leaf, i) {
      if (i % 2 == 0) {
        parse(leaf, res, param);
      }
    });
  }
}

function arrltr(node, res, param) {
  node.leaves().forEach(function (leaf, i) {
    if (i % 2 == 1) {
      if (!leaf.isToken()) {
        parse(leaf, res, param);
      }
    }
  });
}

function cpeapl(node, res, param) {
  if (node.size() > 2) {
    var leaf = node.leaf(1);
    if (!leaf.isToken()) {
      parse(leaf, res, param);
    }
  }
}

;});