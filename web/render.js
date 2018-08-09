define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _ignore = require('./ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _Tree = require('./Tree');

var _Tree2 = _interopRequireDefault(_Tree);

var _jsx = require('./jsx');

var _jsx2 = _interopRequireDefault(_jsx);

var _join = require('./join2');

var _join2 = _interopRequireDefault(_join);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var res;

function stmt(node, param) {
  recursion(node, param);
}

function recursion(node, param) {
  if (node.isToken()) {
    var token = node.token();
    if (token.isVirtual()) {
      return;
    }
    if (!token.ignore) {
      res += token.content();
    }
    while (token.next()) {
      token = token.next();
      if (token.isVirtual() || !_ignore2.default.S.hasOwnProperty(token.type())) {
        break;
      }
      if (!token.ignore) {
        res += token.content();
      }
    }
  } else {
    switch (node.name()) {
      case Node.JSXElement:
      case Node.JSXSelfClosingElement:
        res += (0, _jsx2.default)(node, true, param);
        return;
      case Node.FNEXPR:
      case Node.FNDECL:
      case Node.CLASSEXPR:
        var tree = new _Tree2.default();
        res += tree.parse(node);
        return;
    }
    node.leaves().forEach(function (leaf) {
      recursion(leaf, param);
    });
  }
}

function parse(node, param) {
  res = '';

  var len = node.size();
  node.leaves().forEach(function (leaf, i) {
    //fnbody
    if (i == len - 2) {
      leaf.leaves().forEach(function (item) {
        stmt(item, param);
      });
    } else {
      res += (0, _join2.default)(leaf);
    }
  });
  return res;
}

exports.default = parse;});