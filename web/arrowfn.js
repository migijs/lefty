define(function(require, exports, module){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (node, res, param, opt) {
  node.leaves().forEach(function (leaf) {
    parse(leaf, res, param, opt);
  });
};

var _homunculus = require('homunculus');

var _homunculus2 = _interopRequireDefault(_homunculus);

var _linkage = require('./linkage');

var _linkage2 = _interopRequireDefault(_linkage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

function parse(node, res, param, opt) {
  switch (node.name()) {
    case Node.EXPRSTMT:
      (0, _linkage2.default)(node.first(), param, opt).arr.forEach(function (item) {
        res[item] = true;
      });
      break;
    case Node.VARSTMT:
      node.leaves().forEach(function (leaf, i) {
        if (i % 2 === 1) {
          var initlz = leaf.leaf(1);
          var temp = (0, _linkage2.default)(initlz.leaf(1), param, opt);
          temp.arr.forEach(function (item) {
            res[item] = true;
          });
        }
      });
      break;
    case Node.BLOCKSTMT:
      var block = node.first();
      for (var i = 1, _leaves = block.leaves(); i < _leaves.length - 1; i++) {
        parse(_leaves[i], res, param, opt);
      }
      break;
    case Node.IFSTMT:
      var condition = node.leaf(2);
      (0, _linkage2.default)(condition, param, opt).arr.forEach(function (item) {
        res[item] = true;
      });
      parse(node.last(), res, param, opt);
      break;
    case Node.ITERSTMT:
      var peek = node.first().token().content();
      if (peek === 'for') {
        var first = node.leaf(2);
        // for(;...
        if (first.isToken()) {} else {
          if (first.name() === Node.LEXDECL) {
            parse(first, res, param, opt);
          } else if (first.name() === Node.VARSTMT) {
            parse(first, res, param, opt);
          }
        }
        var second = node.leaf(3);
        // for(;;...
        if (second.isToken()) {} else {
          var temp = (0, _linkage2.default)(second, param, opt);
          temp.arr.forEach(function (item) {
            res[item] = true;
          });
        }
        var third = node.leaf(4);
        if (third.isToken()) {
          third = node.leaf(5);
          if (third.isToken()) {} else {
            var _temp = (0, _linkage2.default)(third, param, opt);
            _temp.arr.forEach(function (item) {
              res[item] = true;
            });
          }
        } else {
          var _temp2 = (0, _linkage2.default)(third, param, opt);
          _temp2.arr.forEach(function (item) {
            res[item] = true;
          });
        }
      } else if (peek === 'do') {
        var _blockstmt = node.leaf(1);
        parse(_blockstmt, res, param, opt);
        var _temp3 = (0, _linkage2.default)(node.leaf(4), param, opt);
        _temp3.arr.forEach(function (item) {
          res[item] = true;
        });
      } else if (peek === 'while') {
        var _temp4 = (0, _linkage2.default)(node.leaf(2), param, opt);
        _temp4.arr.forEach(function (item) {
          res[item] = true;
        });
        var stmt = node.last();
        parse(stmt, res, param, opt);
      }
      break;
    case Node.LEXDECL:
      node.leaves().forEach(function (leaf, i) {
        if (i % 2 === 1) {
          var initlz = leaf.leaf(1);
          var _temp5 = (0, _linkage2.default)(initlz.leaf(1), param, opt);
          _temp5.arr.forEach(function (item) {
            res[item] = true;
          });
        }
      });
      break;
    case Node.RETSTMT:
      // 第一层arrowFn的return语句不包含在linkage中，还有递归return的arrowFn也是
      if (opt.arrowFn.length > 0) {
        var allReturn = true;
        for (var _i = 0, len = opt.arrowFn.length; _i < len; _i++) {
          if (!opt.arrowFn[_i]) {
            allReturn = false;
            break;
          }
        }
        if (!allReturn) {
          (0, _linkage2.default)(node.leaf(1), param, opt).arr.forEach(function (item) {
            res[item] = true;
          });
        }
      }
      break;
    case Node.WITHSTMT:
      (0, _linkage2.default)(node.leaf(2), param, opt).arr.forEach(function (item) {
        res[item] = true;
      });
      var blockstmt = node.last();
      parse(blockstmt, res, param, opt);
      break;
    case Node.SWCHSTMT:
      (0, _linkage2.default)(node.leaf(2), param, opt).arr.forEach(function (item) {
        res[item] = true;
      });
      var caseblock = node.last();
      parse(caseblock, res, param, opt);
      break;
    case Node.CASEBLOCK:
      var leaves = node.leaves();
      for (var _i2 = 1; _i2 < leaves.length - 1; _i2++) {
        var leaf = leaves[_i2];
        if (leaf.name() === Node.CASECLAUSE) {
          var expr = leaf.leaf(1);
          var _temp6 = (0, _linkage2.default)(expr, param, opt);
          _temp6.arr.forEach(function (item) {
            res[item] = true;
          });
          parse(leaf.last(), res, param, opt);
        } else if (leaf.name() === Node.DFTCLAUSE) {
          parse(leaf.last(), res, param, opt);
        }
      }
      break;
  }
}

;});