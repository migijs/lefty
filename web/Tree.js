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

var _render = require('./render');

var _render2 = _interopRequireDefault(_render);

var _join = require('./join2');

var _join2 = _interopRequireDefault(_join);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = _homunculus2.default.getClass('token', 'jsx');
var Node = _homunculus2.default.getClass('node', 'jsx');

var Tree = function () {
  function Tree() {
    _classCallCheck(this, Tree);

    this.res = '';
  }

  _createClass(Tree, [{
    key: 'parse',
    value: function parse(node) {
      this.recursion(node, false);
      return this.res;
    }
  }, {
    key: 'recursion',
    value: function recursion(node, inClass) {
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
            this.res += (0, _jsx2.default)(node, {}, this.param);
            return;
          case Node.CLASSDECL:
            inClass = this.klass(node);
            break;
          case Node.CLASSEXPR:
            inClass = this.klass(node);
            break;
          case Node.CLASSBODY:
            if (inClass) {
              this.param = {
                getHash: {},
                setHash: {},
                evalHash: {},
                bindHash: {},
                linkHash: {},
                linkedHash: {}
              };
              this.list(node);
            }
            break;
          case Node.METHOD:
            var isRender = this.method(node);
            if (isRender) {
              this.res += (0, _render2.default)(node, this.param || {});
              return;
            }
            break;
          case Node.ANNOT:
            if (['@bind', '@eval', '@link'].indexOf(node.first().token().content()) > -1) {
              this.res += (0, _ignore2.default)(node, true).res;
            } else {
              this.res += (0, _join2.default)(node);
            }
            return;
          case Node.LEXBIND:
            if (inClass && node.parent().name() === Node.CLASSELEM) {
              this.res += this.bindLex(node);
              return;
            }
            break;
        }
        node.leaves().forEach(function (leaf) {
          self.recursion(leaf, inClass);
        });
        switch (node.name()) {
          case Node.FNBODY:
            this.fnbody(node, inClass);
            break;
          case Node.CLASSDECL:
            this.appendName(node);
            inClass = false;
            break;
          case Node.CLASSEXPR:
            inClass = false;
            break;
        }
      }
    }
  }, {
    key: 'klass',
    value: function klass(node) {
      var heritage = node.leaf(2);
      if (heritage && heritage.name() === Node.HERITAGE) {
        var body = node.last().prev();
        var leaves = body.leaves();
        for (var i = 0, len = leaves.length; i < len; i++) {
          var leaf = leaves[i];
          var method = leaf.first();
          if (method.name() === Node.METHOD) {
            var first = method.first();
            if (first.name() === Node.PROPTNAME) {
              var id = first.first();
              if (id.name() === Node.LTRPROPT) {
                id = id.first();
                if (id.isToken()) {
                  id = id.token().content();
                  if (id === 'constructor') {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
      return false;
    }
  }, {
    key: 'method',
    value: function method(node) {
      var first = node.first();
      if (first.name() === Node.PROPTNAME) {
        first = first.first();
        if (first.name() === Node.LTRPROPT) {
          first = first.first();
          if (first.isToken() && first.token().content() === 'render') {
            return true;
          }
        }
      }
    }
  }, {
    key: 'fnbody',
    value: function fnbody(node, inClass) {
      if (!inClass) {
        return;
      }
      var parent = node.parent();
      if (parent.name() === Node.METHOD) {
        var setV = void 0;
        var first = parent.first();
        if (first.isToken() && first.token().content() === 'set') {
          var fmparams = parent.leaf(3);
          if (fmparams && fmparams.name() === Node.FMPARAMS) {
            var single = fmparams.first();
            if (single && single.name() === Node.SINGLENAME) {
              var bindid = single.first();
              if (bindid && bindid.name() === Node.BINDID) {
                setV = bindid.first().token().content();
              }
            }
          }
          var name = parent.leaf(1).first().first().token().content();
          var prev = parent.parent().prev();
          var ids = [];
          if (prev) {
            prev = prev.first();
            if (prev.name() === Node.ANNOT && ['@bind', '@eval'].indexOf(prev.first().token().content()) > -1) {
              ids.push(name);
            }
          }
          ids = ids.concat(this.param.linkedHash[name] || []);
          if (ids.length) {
            if (setV) {
              if (ids.length === 1) {
                this.res += ';this.__array("';
                this.res += ids[0] + '",';
                this.res += setV;
                this.res += ')';
              } else {
                this.res += ';this.__array(["';
                this.res += ids.join('","') + '"],';
                this.res += setV;
                this.res += ')';
              }
            }
            if (ids.length === 1) {
              this.res += ';this.__data("';
              this.res += ids[0];
              this.res += '")';
            } else {
              this.res += ';this.__data(["';
              this.res += ids.join('","');
              this.res += '"])';
            }
          }
        }
      }
    }
  }, {
    key: 'list',
    value: function list(node) {
      var _this = this;

      var leaves = node.leaves();
      var length = leaves.length;
      for (var i = 0; i < length; i++) {
        var item = leaves[i].first();
        if (item.name() === Node.ANNOT) {
          var annot = item.first().token().content();
          var method = leaves[i + 1] ? leaves[i + 1].first() : null;
          if (method && method.name() === Node.METHOD) {
            var first = method.first();
            if (first.isToken()) {
              var token = first.token().content();
              if (token === 'set' && annot === '@bind') {
                var name = first.next().first().first().token().content();
                this.param.bindHash[name] = true;
              } else if (token === 'set' && annot === '@eval') {
                var _name = first.next().first().first().token().content();
                this.param.evalHash[_name] = true;
              } else if (token === 'get' && annot === '@link') {
                (function () {
                  var name = first.next().first().first().token().content();
                  _this.param.linkHash[name] = _this.param.linkHash[name] || [];
                  var params = item.leaf(2);
                  if (params && params.name() === Node.FMPARAMS) {
                    params.leaves().forEach(function (param) {
                      if (param.name() === Node.SINGLENAME) {
                        param = param.first();
                        if (param.name() === Node.BINDID) {
                          param = param.first();
                          if (param.isToken()) {
                            param = param.token().content();
                            this.param.linkHash[name].push(param);
                            this.param.linkedHash[param] = this.param.linkedHash[param] || [];
                            this.param.linkedHash[param].push(name);
                          }
                        }
                      }
                    }.bind(_this));
                  }
                })();
              }
            }
          } else if (method && method.name() === Node.LEXBIND) {
            var _first = method.first();
            if (_first.name() === Node.BINDID) {
              var _name2 = _first.first().token().content();
              parseLex(this.param, _name2, item, annot);
            }
          }
          //连续2个
          else if (method && method.name() === Node.ANNOT) {
              var item2 = method;
              var annot2 = method.first().token().content();
              method = leaves[i + 2] ? leaves[i + 2].first() : null;
              if (method && method.name() === Node.LEXBIND) {
                var _first2 = method.first();
                if (_first2.name() === Node.BINDID) {
                  var _name3 = _first2.first().token().content();
                  parseLex(this.param, _name3, item, annot);
                  parseLex(this.param, _name3, item2, annot2);
                }
              }
            }
        } else if (item.name() === Node.METHOD) {
          var _first3 = item.first();
          if (_first3.isToken()) {
            var _token = _first3.token().content();
            var _name4 = _first3.next().first().first().token().content();
            if (_token === 'get') {
              this.param.getHash[_name4] = true;
            } else if (_token === 'set') {
              this.param.setHash[_name4] = true;
            }
          }
        } else if (item.name() === Node.LEXBIND) {
          var _first4 = item.first();
          if (_first4.name() === Node.BINDID) {
            var _name5 = _first4.first().token().content();
            this.param.getHash[_name5] = true;
            this.param.setHash[_name5] = true;
          }
        }
      }
    }
  }, {
    key: 'appendName',
    value: function appendName(node) {
      var heritage = node.leaf(2);
      //必须有继承
      if (heritage && heritage.name() === Node.HERITAGE) {
        //必须有constructor
        if (hasCons(node)) {
          var name = node.leaf(1).first().token().content();
          this.res += 'migi.name(' + name + ',"' + name + '");';
        }
      }
    }
  }, {
    key: 'bindLex',
    value: function bindLex(node) {
      var parent = node.parent();
      var bindid = node.first();
      if (bindid.name() === Node.BINDID) {
        var token = bindid.first();
        var name = token.token().content();
        var init = node.leaf(1);

        var ids = [];
        var prev = parent.prev();
        if (prev) {
          prev = prev.first();
          if (prev.name() === Node.ANNOT && ['@bind', '@eval'].indexOf(prev.first().token().content()) > -1) {
            ids.push(name);
          }
        }
        ids = ids.concat(this.param.linkedHash[name] || []);

        var s = '';
        s += 'set ' + name + '(v){';
        s += 'this.__setBind("' + name + '",v)';
        if (ids.length) {
          if (ids.length === 1) {
            s += ';this.__data("';
            s += ids[0];
            s += '")';
          } else {
            s += ';this.__data(["';
            s += ids.join('","');
            s += '"])';
          }
        }
        s += '}get ' + name + '(){';
        s += (0, _ignore2.default)(token).res;
        if (init) {
          s += 'if(this.__initBind("' + name + '"))';
          s += 'this.__setBind("' + name + '",';
          s += (0, _ignore2.default)(init.first()).res;
          s += (0, _join2.default)(init.last());
          s += ');';
        }
        s += 'return this.__getBind("' + name + '")}';
        return s;
      }
    }
  }]);

  return Tree;
}();

function hasCons(node) {
  var body = node.last().prev();
  var leaves = body.leaves();
  for (var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    var method = leaf.first();
    if (method.name() === Node.METHOD) {
      var first = method.first();
      if (first.name() === Node.PROPTNAME) {
        var id = first.first();
        if (id.name() === Node.LTRPROPT) {
          id = id.first();
          if (id.isToken()) {
            id = id.token().content();
            if (id === 'constructor') {
              return true;
            }
          }
        }
      }
    }
  }
}

function parseLex(param, name, item, annot) {
  if (annot === '@bind') {
    param.bindHash[name] = true;
  } else if (annot === '@eval') {
    param.evalHash[name] = true;
  } else if (annot === '@link') {
    param.linkHash[name] = param.linkHash[name] || [];
    var params = item.leaf(2);
    if (params && params.name() === Node.FMPARAMS) {
      params.leaves().forEach(function (item) {
        if (item.name() === Node.SINGLENAME) {
          item = item.first();
          if (item.name() === Node.BINDID) {
            item = item.first();
            if (item.isToken()) {
              item = item.token().content();
              param.linkHash[name].push(item);
              param.linkedHash[item] = param.linkedHash[item] || [];
              param.linkedHash[item].push(name);
            }
          }
        }
      });
    }
  }
}

exports.default = Tree;});