define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _jsx = require('./jsx');

var _jsx2 = _interopRequireDefault(_jsx);

var _ignore = require('./ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _linkage = require('./linkage');

var _linkage2 = _interopRequireDefault(_linkage);

var _join = require('./join2');

var _join2 = _interopRequireDefault(_join);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var InnerTree = function () {
  function InnerTree() {
    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var param = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, InnerTree);

    this.res = '';
    this.opt = opt;
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
            this.res += (0, _jsx2.default)(node, {
              isInBind: self.opt.isInBind || self.opt.isBind,
              arrowFn: self.opt.arrowFn
            }, self.param);
            return;
          case Node.RETSTMT:
            if (self.opt.isBind || self.opt.isInBind) {
              var allReturn = true;
              self.opt.arrowFn = self.opt.arrowFn || [];
              for (var i = 0, len = self.opt.arrowFn.length; i < len; i++) {
                if (!self.opt.arrowFn[i]) {
                  allReturn = false;
                  break;
                }
              }
              if (allReturn) {
                var temp = (0, _linkage2.default)(node.leaf(1), self.param, {
                  arrowFn: self.opt.arrowFn
                });
                var list = temp.arr;
                var listener = list.length === 1 ? '"' + list[0] + '"' : JSON.stringify(list);
                if (list.length) {
                  return this.res += (0, _join2.default)(node.first()) + 'new migi.Obj(' + listener + ',()=>{return(' + new InnerTree(self.opt, self.param).parse(node.leaf(1)).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1') + ')})';
                }
              }
            }
            break;
          case Node.ARROWFN:
            self.opt.arrowFn = self.opt.arrowFn || [];
            if (self.opt.arrowFn.length === 0) {
              self.opt.arrowFn.push(true);
            } else {
              var is = false;
              var _temp = node.parent();
              if (_temp && _temp.name() === Node.ARGLIST) {
                _temp = _temp.parent();
                if (_temp && _temp.name() === Node.ARGS) {
                  var callexpr = _temp.parent();
                  _temp = _temp.prev();
                  if (_temp && _temp.name() === Node.MMBEXPR) {
                    _temp = _temp.leaf(2);
                    if (_temp.isToken() && _temp.token().content() === 'map') {
                      is = callexpr.parent().name() === Node.RETSTMT;
                    }
                  }
                }
              }
              self.opt.arrowFn.push(is);
            }
            break;
        }
        node.leaves().forEach(function (leaf) {
          self.recursion(leaf);
        });
        switch (node.name()) {
          case Node.ARROWFN:
            self.opt.arrowFn.pop();
            break;
        }
      }
    }
  }]);

  return InnerTree;
}();

exports.default = InnerTree;});