define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _Tree = require('./Tree');

var _Tree2 = _interopRequireDefault(_Tree);

var _jsx = require('./jsx');

var _jsx2 = _interopRequireDefault(_jsx);

var _ignore = require('./ignore');

var _ignore2 = _interopRequireDefault(_ignore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var InnerTree = function () {
  function InnerTree(param) {
    _classCallCheck(this, InnerTree);

    this.res = '';
    this.param = param;
  }

  _createClass(InnerTree, [{
    key: 'parse',
    value: function parse(node) {
      this.recursion(node);
      return this.res;
    }
  }, {
    key: 'recursion',
    value: function recursion(node) {
      var self = this;
      var isToken = node.isToken();
      if (isToken) {
        var token = node.token();
        if (token.isVirtual()) {
          return;
        }
        if (!token.ignore) {
          this.res += token.content();
        }
        while (token.next()) {
          token = token.next();
          if (token.isVirtual() || !_ignore2.default.S.hasOwnProperty(token.type())) {
            break;
          }
          if (!token.ignore) {
            this.res += token.content();
          }
        }
      } else {
        switch (node.name()) {
          case Node.JSXElement:
          case Node.JSXSelfClosingElement:
            this.res += (0, _jsx2.default)(node, true, self.param);
            return;
          case Node.FNEXPR:
          case Node.FNDECL:
          case Node.CLASSEXPR:
            var tree = new _Tree2.default();
            this.res += tree.parse(node);
            return;
        }
        node.leaves().forEach(function (leaf) {
          self.recursion(leaf);
        });
      }
    }
  }]);

  return InnerTree;
}();

exports.default = InnerTree;});