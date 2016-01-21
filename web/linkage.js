define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res, varHash, modelHash, thisHash, thisModelHash) {
  if(node.isToken()) {
    var v = node.token().content();
    if(varHash.hasOwnProperty(v)) {
      res[varHash[v]] = true;
    }
    else if(modelHash.hasOwnProperty(v)) {
      res['model.' + modelHash[v]] = true;
    }
  }
  else {
    switch(node.name()) {
      case Node.PRMREXPR:
        parse(node.first(), res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.MMBEXPR:
        mmbexpr(node, res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.CNDTEXPR:
        parse(node.first(), res, varHash, modelHash, thisHash, thisModelHash);
        parse(node.leaf(2), res, varHash, modelHash, thisHash, thisModelHash);
        parse(node.last(), res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.LOGOREXPR:
      case Node.LOGANDEXPR:
      case Node.BITANDEXPR:
      case Node.BITOREXPR:
      case Node.BITXOREXPR:
      case Node.EQEXPR:
      case Node.RELTEXPR:
      case Node.SHIFTEXPR:
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        parse(node.first(), res, varHash, modelHash, thisHash, thisModelHash);
        //可能有连续多个表达式
        for(var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, varHash, modelHash, thisHash, thisModelHash);
        }
        break;
      case Node.UNARYEXPR:
      case Node.NEWEXPR:
        parse(node.last(), res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.POSTFIXEXPR:
        parse(node.first(), res, varHash, modelHash, thisHash, thisModelHash);
      case Node.CALLEXPR:
        callexpr(node, res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.ARRLTR:
        arrltr(node, res, varHash, modelHash, thisHash, thisModelHash);
        break;
      case Node.CPEAPL:
        cpeapl(node, res, varHash, modelHash, thisHash, thisModelHash);
        break;
    }
  }
}
function mmbexpr(node, res, varHash, modelHash, thisHash, thisModelHash) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken()) {
      var me = first.token().content();
      if(me == 'this' || thisHash.hasOwnProperty(me)) {
        var dot = node.leaf(1);
        if(dot.isToken()) {
          if(dot.token().content() == '.') {
            var id = dot.next().token().content();
            if(id == 'model') {
              if(node.name() == Node.MMBEXPR) {
                var next = node.next();
                if(next.isToken()) {
                  if(next.token().content() == '.') {
                    next = next.next();
                    if(next.isToken()) {
                      var token = next.token();
                      res['model.' + token.content()] = true;
                    }
                  }
                  else if(next.token().content() == '[') {
                    var expr = next.next();
                    if(expr.name() == Node.PRMREXPR) {
                      var s = expr.first();
                      if(s.isToken()) {
                        s = s.token();
                        if(s.type() == Token.STRING) {
                          res['model.' + s.val()] = true;
                        }
                      }
                    }
                  }
                }
              }
            }
            else {
              res[id] = true;
            }
          }
          else if(dot.token().content() == '[') {
            var expr = dot.next();
            if(expr.name() == Node.EXPR) {
              parse(expr.last(), res, varHash, modelHash, thisHash, thisModelHash);
            }
            else if(expr.name() == Node.PRMREXPR) {
              var s = expr.first();
              if(s.isToken()) {
                s = s.token();
                if(s.type() == Token.STRING) {
                  res[s.val()] = true;
                }
              }
            }
            else {
              parse(expr, res, varHash, modelHash, thisHash, thisModelHash);
            }
          }
        }
      }
      else if(thisModelHash.hasOwnProperty(me)) {
        var dot = prmr.next();
        if(dot.isToken()) {
          if(dot.token().content() == '.') {
            var id = dot.next().token().content();
            res['model.' + id] = true;
          }
          else if(dot.token().content() == '[') {
            var expr = dot.next();
            if(expr.name() == Node.PRMREXPR) {
              var s = expr.first();
              if(s.isToken()) {
                s = s.token();
                if(s.type() == Token.STRING) {
                  res['model.' + s.val()] = true;
                }
              }
            }
          }
        }
      }
      else if(varHash.hasOwnProperty(me)) {
        res[varHash[me]] = true;
      }
      else {
        var bracket = node.leaf(1);
        if(bracket.isToken()) {
          if(bracket.token().content() == '[') {
            var expr = bracket.next();
            if(expr.name() == Node.EXPR) {
              parse(expr.last(), res, varHash, modelHash, thisHash, thisModelHash);
            }
            else {
              parse(expr, res, varHash, modelHash, thisHash, thisModelHash);
            }
          }
        }
      }
    }
  }
  else if(prmr.name() == Node.MMBEXPR) {
    mmbexpr(prmr, res, varHash, modelHash, thisHash, thisModelHash);
    var dot = prmr.next();
    if(dot.isToken() && dot.token().content() == '[') {
      var expr = dot.next();
      if(expr.name() == Node.EXPR) {
        parse(expr.last(), res, varHash, modelHash, thisHash, thisModelHash);
      }
      else if(expr.name() == Node.PRMREXPR) {
        var s = expr.first();
        if(s.isToken()) {
          s = s.token();
          if(s.type() == Token.STRING) {
            res[s.val()] = true;
          }
        }
      }
      else {
        parse(expr, res, varHash, modelHash, thisHash, thisModelHash);
      }
    }
  }
}
function callexpr(node, res, varHash, modelHash, thisHash, thisModelHash) {
  parse(node.first(), res, varHash, modelHash, thisHash, thisModelHash);
  var args = node.last();
  if(args.name() == Node.ARGS) {
    args.leaf(1).leaves().forEach(function(leaf, i) {
      if(i % 2 == 0) {
        parse(leaf, res, varHash, modelHash, thisHash, thisModelHash);
      }
    });
  }
}

function arrltr(node, res, varHash, modelHash, thisHash, thisModelHash) {
  node.leaves().forEach(function(leaf, i) {
    if(i % 2 == 1) {
      if(!leaf.isToken()) {
        parse(leaf, res, varHash, modelHash, thisHash, thisModelHash);
      }
    }
  });
}

function cpeapl(node, res, varHash, modelHash, thisHash, thisModelHash) {
  if(node.size() > 2) {
    var leaf = node.leaf(1);
    if(!leaf.isToken()) {
      parse(leaf, res, varHash, modelHash, thisHash, thisModelHash);
    }
  }
}

exports["default"]=function(node, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  var res = {};
  parse(node, res, varHash, modelHash, thisHash, thisModelHash);
  //取得全部this.xxx后，判断是否有对应的set方法，state为兼容rc也特殊处理
  if(!setHash.hasOwnProperty('state') && !getHash.hasOwnProperty('state')) {
    setHash.state = true;
    getHash.state = getHash.state || [];
  }
  var arr = Object.keys(res).filter(function(item) {
    //this.model特殊处理
    return setHash.hasOwnProperty(item) && getHash.hasOwnProperty(item)
      || /^model\.[a-zA-Z_$][\w$]*\b/.test(item);
  });
  Object.keys(res).forEach(function(item) {
    //如有get方法且显式声明形参依赖
    if(getHash.hasOwnProperty(item)) {
      var deps = getHash[item];
      deps.forEach(function(dep) {
        //声明的依赖需有set方法
        if(arr.indexOf(dep) == -1) {
          arr.push(dep);
        }
      });
    }
  });
  return arr;
};
});