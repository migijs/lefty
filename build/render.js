'use strict';

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
function varstmt(node, param) {
  node.leaves().forEach(function (leaf) {
    if ([Node.VARDECL, Node.LEXBIND].indexOf(leaf.name()) > -1) {
      var id = leaf.first().first();
      if (id.isToken()) {
        id = id.token().content();
        var prmr = leaf.leaf(1);
        if (!prmr) {
          return;
        }
        prmr = prmr.leaf(1);
        if (prmr.name() == Node.PRMREXPR) {
          var v = prmr.first();
          if (!v.isToken()) {
            return;
          }
          v = v.token().content();
          if (v == 'this' || param.thisHash.hasOwnProperty(v)) {
            param.thisHash[id] = true;
          }
        } else if (prmr.name() == Node.MMBEXPR) {
          prmr = prmr.first();
          if (prmr.name() == Node.PRMREXPR) {
            var v = prmr.first().token().content();
            if (v == 'this' || param.thisHash.hasOwnProperty(v)) {
              var dot = prmr.next();
              if (dot.isToken()) {
                if (dot.token().content() == '.') {
                  v = dot.next().token().content();
                  //this.model
                  if (v == 'model') {
                    param.thisModelHash[id] = true;
                  } else {
                    param.varHash[id] = v;
                  }
                }
              }
            }
          }
          //this.model.x
          else if (prmr.name() == Node.MMBEXPR) {
              var mmb = prmr;
              prmr = prmr.first();
              if (prmr.name() == Node.PRMREXPR) {
                var v = prmr.first().token().content();
                if (v == 'this' || param.thisHash.hasOwnProperty(v)) {
                  var dot = prmr.next();
                  if (dot.isToken()) {
                    v = dot.next().token().content();
                    if (v == 'model') {
                      dot = mmb.next();
                      if (dot.isToken()) {
                        if (dot.token().content() == '.') {
                          v = dot.next().token().content();
                          param.modelHash[id] = v;
                        } else if (dot.token().content() == '[') {
                          v = dot.next();
                          if (v.name() == Node.PRMREXPR) {
                            v = v.first().token();
                            if (v.type() == Token.STRING) {
                              param.modelHash[id] = v.val();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
        }
      }
    }
  });
}

function stmt(node, param) {
  switch (node.name()) {
    case Node.VARSTMT:
    case Node.LEXDECL:
      varstmt(node, param);
      break;
  }
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

  //存this.get/set
  param.varHash = {};
  //存this.model.x
  param.modelHash = {};
  //存this
  param.thisHash = {};
  //存this.model
  param.thisModelHash = {};

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

exports.default = parse;