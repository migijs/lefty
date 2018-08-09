define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _Tree = require('./Tree');

var _Tree2 = _interopRequireDefault(_Tree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Lefty = function () {
  function Lefty() {
    _classCallCheck(this, Lefty);

    this.parser = null;
    this.node = null;
  }

  _createClass(Lefty, [{
    key: 'parse',
    value: function parse(code) {
      this.parser = _homunculus2.default.getParser('jsx');
      this.node = this.parser.parse(code);
      var tree = new _Tree2.default();
      return tree.parse(this.node);
    }
  }, {
    key: 'tokens',
    value: function tokens() {
      return this.ast ? this.parser.lexer.tokens() : null;
    }
  }, {
    key: 'ast',
    value: function ast() {
      return this.node;
    }
  }]);

  return Lefty;
}();

exports.default = new Lefty();});