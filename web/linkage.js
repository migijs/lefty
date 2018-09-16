define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (node, param, opt) {
  var res = {};
  // 取得全部this.xxx
  parse(node, res, param, opt);
  var arr = Object.keys(res);
  var bind = false;
  arr = arr.filter(function (item) {
    //model.xxx全部通过
    if (item.indexOf('model.') === 0) {
      bind = true;
      return true;
    }
    //没get不通过
    if (!(param.getHash || {}).hasOwnProperty(item)) {
      return false;
    }
    //有get需要有bind或link
    return (param.bindHash || {}).hasOwnProperty(item) || (param.evalHash || {}).hasOwnProperty(item) || (param.linkHash || {}).hasOwnProperty(item);
  });
  // 只要有一个是双向绑定就是双向
  arr.forEach(function (item) {
    if ((param.bindHash || {}).hasOwnProperty(item)) {
      bind = true;
    }
  });
  // 因特殊Array优化需要，this.v或者(..., this.v)形式的侦听变量
  // see https://github.com/migijs/migi/issues/29
  var single = false;
  if (node.name() === Node.MMBEXPR && node.leaves().length === 3 && node.first().name() === Node.PRMREXPR) {
    single = arr.length === 1 && node.first().first().isToken() && node.first().first().token().content() === 'this' && node.last().isToken() && node.last().token().content() === arr[0];
  } else if (node.name() === Node.MMBEXPR && node.leaves().length === 3 && node.first().name() === Node.MMBEXPR && node.first().leaves().length === 3 && node.first().first().name() === Node.PRMREXPR) {
    single = arr.length === 1 && node.first().first().first().isToken() && node.first().first().first().token().content() === 'this' && node.first().last().isToken() && node.first().last().token().content() === 'model' && node.last().isToken() && node.last().token().content() === arr[0].slice(6);
  } else if (node.name() === Node.PRMREXPR && node.first().name() === Node.CPEAPL) {
    var _cpeapl = node.first();
    if (_cpeapl.leaves().length === 3 && _cpeapl.leaf(1).name() === Node.EXPR) {
      var expr = _cpeapl.leaf(1);
      if (expr.last().name() === Node.MMBEXPR) {
        var _mmbexpr = expr.last();
        if (_mmbexpr.leaves().length === 3 && _mmbexpr.first().name() === Node.PRMREXPR && _mmbexpr.last().isToken()) {
          single = arr.length && _mmbexpr.first().first().isToken() && _mmbexpr.first().first().token().content() === 'this' && _mmbexpr.last().token().content() === arr[arr.length - 1];
        }
      }
    } else if (_cpeapl.leaves().length === 3 && _cpeapl.leaf(1).name() === Node.MMBEXPR && _cpeapl.first().isToken() && _cpeapl.first().token().content() === '(') {
      var _mmbexpr2 = _cpeapl.leaf(1);
      if (_mmbexpr2.leaves().length === 3 && _mmbexpr2.first().name() === Node.PRMREXPR && _mmbexpr2.last().isToken()) {
        single = arr.length && _mmbexpr2.first().first().isToken() && _mmbexpr2.first().first().token().content() === 'this' && _mmbexpr2.last().token().content() === arr[arr.length - 1];
      }
    }
  }
  return {
    arr: arr,
    single: single,
    bind: bind
  };
};

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _arrowfn = require('./arrowfn');

var _arrowfn2 = _interopRequireDefault(_arrowfn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

function parse(node, res, param, opt) {
  if (node.isToken()) {} else {
    switch (node.name()) {
      case Node.EXPR:
        parse(node.first(), res, param, opt);
        //可能有连续多个表达式
        for (var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
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
        for (var _i = 2, _leaves = node.leaves(), _len = _leaves.length; _i < _len; _i += 2) {
          parse(node.leaf(_i), res, param, opt);
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
        for (var _i2 = 0, _leaves2 = node.leaves(), _len2 = _leaves2.length; _i2 < _len2; _i2++) {
          var leaf = node.leaf(_i2);
          if (!leaf.isToken()) {
            parse(leaf, res, param, opt);
          }
        }
        break;
      case Node.ARROWFN:
        opt.arrowFn = opt.arrowFn || [];
        var temp = node.parent();
        if (temp && temp.name() === Node.ARGLIST) {
          temp = temp.parent();
          if (temp && temp.name() === Node.ARGS) {
            temp = temp.prev();
            if (temp && temp.name() === Node.MMBEXPR) {
              var _callexpr = temp.parent();
              temp = temp.leaf(2);
              if (temp.isToken() && temp.token().content() === 'map') {
                var body = node.last().leaf(1);
                if (opt.arrowFn.length === 0) {
                  opt.arrowFn.push(true);
                } else {
                  opt.arrowFn.push(_callexpr.parent().name() === Node.RETSTMT);
                }
                (0, _arrowfn2.default)(body, res, param, opt);
                opt.arrowFn.pop();
              }
            }
          }
        }
        break;
      case Node.JSXElement:
        parse(node.first(), res, param, opt);
        for (var _i3 = 1, _leaves3 = node.leaves(); _i3 < _leaves3.length - 1; _i3++) {
          parse(_leaves3[_i3], res, param, opt);
        }
        break;
      case Node.JSXSelfClosingElement:
      case Node.JSXOpeningElement:
        for (var _i4 = 1, _leaves4 = node.leaves(); _i4 < _leaves4.length - 1; _i4++) {
          parse(_leaves4[_i4], res, param, opt);
        }
        break;
      case Node.JSXAttribute:
        var value = node.last();
        if (value.name() === Node.JSXAttributeValue) {
          var first = value.first();
          if (first.isToken() && first.token().content() === '{') {
            parse(value.leaf(1), res, param, opt);
          }
        }
        break;
      case Node.JSXChild:
        node.leaves().forEach(function (leaf) {
          parse(leaf, res, param, opt);
        });
        break;
    }
  }
}
function mmbexpr(node, res, param, opt) {
  var prmr = node.first();
  if (prmr.name() === Node.PRMREXPR) {
    var first = prmr.first();
    if (first.isToken()) {
      var me = first.token().content();
      if (me === 'this') {
        var dot = node.leaf(1);
        if (dot.isToken()) {
          if (dot.token().content() === '.') {
            var token = dot.next();
            var id = token.token().content();
            if (id === 'model') {
              if (node.name() === Node.MMBEXPR) {
                var next = node.next();
                if (next.isToken()) {
                  if (next.token().content() === '.') {
                    next = next.next();
                    if (next.isToken()) {
                      var _token = next.token();
                      res['model.' + _token.content()] = true;
                    }
                  } else if (next.token().content() === '[') {
                    var expr = next.next();
                    if (expr.name() === Node.PRMREXPR) {
                      var s = expr.first();
                      if (s.isToken()) {
                        s = s.token();
                        if (s.type() === Token.STRING) {
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
          } else if (dot.token().content() === '[') {
            var _expr = dot.next();
            if (_expr.name() === Node.EXPR) {
              parse(_expr.last(), res, param, opt);
            } else if (_expr.name() === Node.PRMREXPR) {
              var _s = _expr.first();
              if (_s.isToken()) {
                _s = _s.token();
                if (_s.type() === Token.STRING) {
                  res[_s.val()] = true;
                }
              }
            } else {
              parse(_expr, res, param, opt);
            }
          }
        }
      } else {
        var bracket = node.leaf(1);
        if (bracket.isToken()) {
          if (bracket.token().content() === '[') {
            var _expr2 = bracket.next();
            if (_expr2.name() === Node.EXPR) {
              parse(_expr2.last(), res, param, opt);
            } else {
              parse(_expr2, res, param, opt);
            }
          }
        }
      }
    } else {
      parse(first, res, param, opt);
    }
  } else if (prmr.name() === Node.MMBEXPR) {
    mmbexpr(prmr, res, param, opt);
    var _dot = prmr.next();
    if (_dot.isToken() && _dot.token().content() === '[') {
      var _expr3 = _dot.next();
      if (_expr3.name() === Node.EXPR) {
        parse(_expr3.last(), res, param, opt);
      } else if (_expr3.name() === Node.PRMREXPR) {
        var _s2 = _expr3.first();
        if (_s2.isToken()) {
          _s2 = _s2.token();
          if (_s2.type() === Token.STRING) {
            res[_s2.val()] = true;
          }
        }
      } else {
        parse(_expr3, res, param, opt);
      }
    }
  } else {
    parse(prmr, res, param, opt);
  }
}
function callexpr(node, res, param, opt) {
  parse(node.first(), res, param, opt);
  var args = node.last();
  if (args.name() === Node.ARGS) {
    args.leaf(1).leaves().forEach(function (leaf, i) {
      if (i % 2 === 0) {
        parse(leaf, res, param, opt);
      }
    });
  }
}

function arrltr(node, res, param, opt) {
  node.leaves().forEach(function (leaf, i) {
    if (i % 2 === 1) {
      if (!leaf.isToken()) {
        parse(leaf, res, param, opt);
      }
    }
  });
}

function cpeapl(node, res, param, opt) {
  if (node.size() > 2) {
    var leaf = node.leaf(1);
    if (!leaf.isToken()) {
      parse(leaf, res, param, opt);
    }
  }
}

;});