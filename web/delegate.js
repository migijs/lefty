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

var _join = require('./join');

var _join2 = _interopRequireDefault(_join);

var _join3 = require('./join2');

var _join4 = _interopRequireDefault(_join3);

var _jaw = require('jaw');

var _jaw2 = _interopRequireDefault(_jaw);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var S = {};
S[Token.LINE] = S[Token.COMMENT] = S[Token.BLANK] = true;

var res = '';

function parse(node) {
  var prmr = node.leaf(1);
  if (prmr && prmr.name() == Node.PRMREXPR) {
    var objltr = prmr.first();
    if (objltr && objltr.name() == Node.OBJLTR) {
      res = (0, _ignore2.default)(node.first(), true).res + '[';
      recursion(objltr);
      res += (0, _ignore2.default)(node.last(), true).res + ']';
    } else {
      var tree = new _Tree2.default();
      res = tree.parse(node);
      res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
      res = filter(res);
    }
  } else {
    var tree = new _Tree2.default();
    res = tree.parse(node);
    res = res.replace(/^(\s*)\{/, '$1').replace(/}(\s*)$/, '$1');
    res = filter(res);
  }
  return res;
}

function recursion(objltr) {
  res += (0, _ignore2.default)(objltr.first(), true).res;
  for (var i = 1, len = objltr.size(); i < len - 1; i++) {
    var leaf = objltr.leaf(i);
    if (leaf.isToken()) {
      var s = (0, _join4.default)(leaf);
      res += s;
    } else if (leaf.name() == Node.PROPTDEF) {
      res += '[';
      var proptname = leaf.first();
      var s = (0, _join2.default)(proptname).replace(/^(["'])(.+)\1$/, '$2') + '{}';
      s = _jaw2.default.parse(s, { noPriority: true, noValue: true, noMedia: true });
      res += JSON.stringify(s);
      res += ',';
      res += filter((0, _join2.default)(leaf.last()));
      res += ']';
      res += (0, _ignore2.default)(leaf, true).res;
    }
  }
  res += (0, _ignore2.default)(objltr.last(), true).res;
}

function filter(s) {
  if (/^\s*this\b/.test(s) || /^\s*function\b/.test(s)) {
    if (/^\s*this\s*\.\s*model\s*\./.test(s)) {
      return 'new migi.Cb(this.model,' + s + ')';
    }
    return 'new migi.Cb(this,' + s + ')';
  }
  return s;
}

exports.default = parse;});