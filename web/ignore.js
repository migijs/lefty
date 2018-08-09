define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ES6Token = _homunculus2.default.getClass('token', 'js');
var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res;
var append;

function ignore(node, includeLine) {
  if (node instanceof Token || node instanceof ES6Token) {
    if (node.isVirtual()) {
      return;
    }
    node.ignore = true;
    append = '';
    while (node = node.next()) {
      if (node.isVirtual() || !S.hasOwnProperty(node.type())) {
        break;
      }
      var s = node.content();
      res += s;
      append += s;
      if (includeLine || s != '\n') {
        node.ignore = true;
      }
    }
  } else if (node.isToken()) {
    ignore(node.token(), includeLine);
  } else {
    node.leaves().forEach(function (leaf) {
      ignore(leaf, includeLine);
    });
  }
}

function parse(node, includeLine) {
  res = '';
  append = '';
  ignore(node, includeLine);
  return { res: res, append: append };
}

parse.S = S;

exports.default = parse;});