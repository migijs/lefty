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

var _join3 = require('./join2');

var _join4 = _interopRequireDefault(_join3);

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
  var callexpr = node.leaf(1);
  if (opt.isBind) {
    var temp = (0, _linkage2.default)(callexpr, param, {
      arrowFn: opt.arrowFn
    });
    var list = temp.arr;
    var single = temp.single;
    if (list.length) {
      var listener = list.length === 1 ? '"' + list[0] + '"' : JSON.stringify(list);
      if (isAttr) {
        var key = node.prev().prev().token().content();
        if (key === 'value') {
          var tag = node.parent().parent().leaf(1).token().content();
          if (tag === 'input' || tag === 'select') {
            var value = node.leaf(1);
            // 单独值mmbexpr非运算符双向绑定，其余单向
            if (value.name() === Node.MMBEXPR) {
              return 'new migi.Obj(' + listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : ',false') + ',(v)=>{' + (0, _join4.default)(value) + '=v})';
            }
            return 'new migi.Obj(' + listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
          }
        }
      } else if (node.prev() && node.prev().name() === Node.JSXOpeningElement) {
        var _key = node.prev().leaf(1).token().content();
        if (_key === 'textarea') {
          var _value = node.leaf(1);
          if (_value.name() === Node.MMBEXPR) {
            return 'new migi.Obj(' + listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : ',false') + ',(v)=>{' + (0, _join4.default)(_value) + '=v})';
          }
        }
      }
      return 'new migi.Obj(' + listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
    }
  }
  // Obj中再次出现的:input的value还需要添加Obj
  else if (opt.isInBind) {
      if (isAttr) {
        var _key2 = node.prev().prev().token().content();
        if (_key2 === 'value') {
          var _tag = node.parent().parent().leaf(1).token().content();
          if (_tag === 'input' || _tag === 'select') {
            var _temp = (0, _linkage2.default)(callexpr, param, {
              arrowFn: opt.arrowFn
            });
            var _list = _temp.arr;
            if (_list.length) {
              var _value2 = node.leaf(1);
              var _listener = _list.length === 1 ? '"' + _list[0] + '"' : JSON.stringify(_list);
              if (_value2.name() === Node.MMBEXPR) {
                return 'new migi.Obj(' + _listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + ',false' + ',(v)=>{' + (0, _join4.default)(_value2) + '=v})';
              }
              return 'new migi.Obj(' + _listener + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
            }
          }
        }
      } else if (node.prev() && node.prev().name() === Node.JSXOpeningElement) {
        var _key3 = node.prev().leaf(1).token().content();
        if (_key3 === 'textarea') {
          var _temp2 = (0, _linkage2.default)(callexpr, param, {
            arrowFn: opt.arrowFn
          });
          var _list2 = _temp2.arr;
          if (_list2.length) {
            var _value3 = node.leaf(1);
            var _listener2 = _list2.length === 1 ? '"' + _list2[0] + '"' : JSON.stringify(_list2);
            if (_value3.name() === Node.MMBEXPR) {
              return 'new migi.Obj(' + _listener2 + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')}' + ',false' + ',(v)=>{' + (0, _join4.default)(_value3) + '=v})';
            }
            return 'new migi.Obj(' + _listener2 + ',()=>{return(' + new _InnerTree2.default(opt, param).parse(node).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
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