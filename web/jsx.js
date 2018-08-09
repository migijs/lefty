define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _Tree = require('./Tree');

var _Tree2 = _interopRequireDefault(_Tree);

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

function elem(node, isBind, param) {
  var res = '';
  //open和selfClose逻辑复用
  res += selfClose(node.first(), isBind, param);
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
        res += child(leaf, isBind, param);
        comma = true;
        break;
      case Node.TOKEN:
        var s = leaf.token().content();
        //open和close之间的空白不能忽略
        if (/^\s+$/.test(s)) {
          if (leaf.prev().name() == Node.JSXOpeningElement && leaf.next().name() == Node.JSXClosingElement) {
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
        res += parse(leaf, isBind, param);
        comma = true;
    }
  }
  res += '])';
  if (node.last().name() == Node.JSXClosingElement) {
    res += (0, _ignore2.default)(node.last(), true).res;
  }
  return res;
}
function selfClose(node, isBind, param) {
  var res = '';
  var name;
  var first = node.leaf(1);
  if (first.isToken()) {
    name = first.token().content();
  } else if (first.name() == Node.JSXMemberExpression) {
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
  for (var i = 2, len = node.size(); i < len - 1; i++) {
    var leaf = node.leaf(i);
    if (i != 2) {
      res += ',';
    }
    switch (leaf.name()) {
      case Node.JSXBindAttribute:
        res += attr(leaf, isBind, param);
        break;
      case Node.JSXAttribute:
        res += attr(leaf, isBind && !isCp, param);
        break;
      case Node.JSXSpreadAttribute:
        res += spread(leaf);
        break;
    }
  }
  res += ']';
  return res;
}
function attr(node, isBind, param) {
  var res = '';
  var key = node.first().token().content();
  if (key.charAt(0) == '@') {
    key = key.slice(1);
  }
  var k = '["' + key + '"';
  res += k + ',';
  var v = node.last();
  if (v.isToken()) {
    v = v.token().content();
    res += v;
  } else if (/^on-?[a-zA-Z]/.test(key)) {
    res += onEvent(v, isBind, param);
  } else {
    res += child(v, isBind, param);
  }
  res += ']';
  return res;
}
function onEvent(node, isBind, param) {
  var res = (0, _delegate2.default)(node, param);
  return res;
}
function spread(node) {
  return (0, _join2.default)(node.leaf(2));
}
function child(node, isBind, param) {
  if (isBind) {
    var temp = (0, _linkage2.default)(node.leaf(1), param);
    var list = temp.arr;
    var single = temp.single;
    if (list.length == 1) {
      return 'new migi.Obj("' + list[0] + '",this,function(){return(' + new _Tree2.default().parse(node).replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
    } else if (list.length > 1) {
      return 'new migi.Obj(' + JSON.stringify(list) + ',this,function(){return(' + new _Tree2.default().parse(node).replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1') + ')}' + (single ? ',true' : '') + ')';
    } else {
      return new _InnerTree2.default(param).parse(node).replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
    }
  }
  return new _Tree2.default().parse(node).replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
}

function parse(node, isBind, param) {
  var res = '';
  switch (node.name()) {
    case Node.JSXElement:
      res += elem(node, isBind, param);
      break;
    case Node.JSXSelfClosingElement:
      res += selfClose(node, isBind, param);
      res += ')';
      break;
  }
  return res;
}

exports.default = parse;});