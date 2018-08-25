define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _InnerTree = require('./InnerTree');

var _InnerTree2 = _interopRequireDefault(_InnerTree);

var _linkage = require('./linkage');

var _linkage2 = _interopRequireDefault(_linkage);

var _ignore = require('./ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _join = require('./join');

var _join2 = _interopRequireDefault(_join);

var _delegate = require('./delegate');

var _delegate2 = _interopRequireDefault(_delegate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

function elem(node, opt, param) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), opt, param);
  res += ',[';
  var comma = false;
  for (var i = 1, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    switch (leaf.name()) {
      case Node.JSXChild:
        if (comma) {
          res += ',';
          comma = false;
        }
        res += child(leaf, opt, param);
        comma = true;
        break;
      case Node.TOKEN:
        var s = leaf.token().content();
        //open和close之间的空白不能忽略
        if (/^\s+$/.test(s)) {
          if (leaf.prev().name() === Node.JSXOpeningElement && leaf.next().name() === Node.JSXClosingElement) {
            res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\n\\\n') + '"';
          } else {
            res += s;
          }
        } else {
          if (comma) {
            res += ',';
            comma = false;
          }
          res += '"' + s.replace(/"/g, '\\"').replace(/\n/g, '\\n\\\n') + '"';
          comma = true;
        }
        break;
      default:
        if (comma) {
          res += ',';
          comma = false;
        }
        res += parse(leaf, opt, param);
        comma = true;
    }
  }
  res += '])';
  if (node.last().name() === Node.JSXClosingElement) {
    res += (0, _ignore2.default)(node.last(), true).res;
  }
  return res;
}
function selfClose(node, opt, param) {
  var res = '';
  var name = void 0;
  var first = node.leaf(1);
  if (first.isToken()) {
    name = first.token().content();
  } else if (first.name() === Node.JSXMemberExpression) {
    name = first.first().token().content();
    for (var i = 1, len = first.size(); i < len; i++) {
      name += first.leaf(i).token().content();
    }
  }
  var isCp = void 0;
  if (/^[A-Z]/.test(name)) {
    isCp = true;
    res += 'migi.createCp(';
    res += name;
  } else {
    res += 'migi.createVd(';
    res += '"' + name + '"';
  }
  res += ',[';
  for (var _i = 2, _len = node.size(); _i < _len - 1; _i++) {
    var leaf = node.leaf(_i);
    if (_i !== 2) {
      res += ',';
    }
    switch (leaf.name()) {
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
  var res = '';
  var key = node.first().token().content();
  var name = node.parent().leaf(1).token().content();
  var isCp = /^[A-Z]/.test(name);
  if (key.charAt(0) === '@') {
    key = key.slice(1);
  }
  // 组件属性非@申明均不bind
  else if (isCp && opt.isBind) {
      opt.isBind = false;
    }
  var k = '["' + key + '"';
  res += k + ',';
  var v = node.last();
  if (v.isToken()) {
    v = v.token().content();
    res += v;
  } else if (/^on-?[a-zA-Z]/.test(key)) {
    res += onEvent(v, opt, param);
  } else {
    res += child(v, opt, param, true);
  }
  res += ']';
  return res;
}
function onEvent(node, opt, param) {
  return (0, _delegate2.default)(node, param);
}
function spread(node) {
  return (0, _join2.default)(node.leaf(2));
}
function child(node, opt, param, isAttr) {
  // 初次进arrowFn标识isArrowFn，且在innerTree中isInArrowFn；再次进入时识别出来
  var callexpr = node.leaf(1);
  // if(callexpr.name() === Node.CALLEXPR
  //   && callexpr.first().name() === Node.MMBEXPR
  //   && callexpr.first().last().isToken()
  //   && callexpr.first().last().token().content() === 'map'
  //   && callexpr.last().leaf(1).first()
  //   && callexpr.last().leaf(1).first().name() === Node.ARROWFN) {
  //   opt.arrowFn = opt.arrowFn || [];
  // }
  if (opt.isBind) {
    var temp = (0, _linkage2.default)(callexpr, param, {
      arrowFn: opt.arrowFn
    });
    var list = temp.arr;
    var single = temp.single;
    if (list.length === 1) {
      return 'new migi.Obj("' + list[0] + '",this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
    } else if (list.length > 1) {
      return 'new migi.Obj(' + JSON.stringify(list) + ',this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
    }
  }
  // Obj中再次出现的:input的value还需要添加Obj
  else if (opt.isInBind) {
      if (isAttr) {
        var key = node.prev().prev().token().content();
        if (key === 'value') {
          var tag = node.parent().parent().leaf(1).token().content();
          if (tag === 'input' || tag === 'select') {
            var _temp = (0, _linkage2.default)(callexpr, param, {
              arrowFn: opt.arrowFn
            });
            var _list = _temp.arr;
            if (_list.length === 1) {
              return 'new migi.Obj("' + _list[0] + '",this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
            } else if (_list.length > 1) {
              return 'new migi.Obj(' + JSON.stringify(_list) + ',this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
            }
          }
        }
      } else {
        var _key = node.prev().leaf(1).token().content();
        if (_key === 'textarea') {
          var _temp2 = (0, _linkage2.default)(callexpr, param, {
            arrowFn: opt.arrowFn
          });
          var _list2 = _temp2.arr;
          if (_list2.length === 1) {
            return 'new migi.Obj("' + _list2[0] + '",this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
          } else if (_list2.length > 1) {
            return 'new migi.Obj(' + JSON.stringify(_list2) + ',this,function(){return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
          }
        }
      }
    }
  return new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1');
}

function parse(node, opt, param) {
  var res = '';
  switch (node.name()) {
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

exports.default = parse;});