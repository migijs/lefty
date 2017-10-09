define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res, param) {
  if(node.isToken()) {
    var v = node.token().content();
    if(param.varHash.hasOwnProperty(v)) {
      res[param.varHash[v]] = true;
    }
    else if(param.modelHash.hasOwnProperty(v)) {
      res['model.' + param.modelHash[v]] = true;
    }
  }
  else {
    switch(node.name()) {
      case Node.EXPR:
        parse(node.first(), res, param);
        //可能有连续多个表达式
        for(var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param);
        }
        break;
      case Node.PRMREXPR:
        parse(node.first(), res, param);
        break;
      case Node.MMBEXPR:
        mmbexpr(node, res, param);
        break;
      case Node.CNDTEXPR:
        parse(node.first(), res, param);
        parse(node.leaf(2), res, param);
        parse(node.last(), res, param);
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
        parse(node.first(), res, param);
        //可能有连续多个表达式
        for(var i = 2, leaves = node.leaves(), len = leaves.length; i < len; i += 2) {
          parse(node.leaf(i), res, param);
        }
        break;
      case Node.UNARYEXPR:
      case Node.NEWEXPR:
        parse(node.last(), res, param);
        break;
      case Node.POSTFIXEXPR:
        parse(node.first(), res, param);
        break;
      case Node.CALLEXPR:
        callexpr(node, res, param);
        break;
      case Node.ARRLTR:
        arrltr(node, res, param);
        break;
      case Node.CPEAPL:
        cpeapl(node, res, param);
        break;
      case Node.ARGS:
        parse(node.leaf(1), res, param);
        break;
      case Node.ARGLIST:
        for(var i = 0, leaves = node.leaves(), len = leaves.length; i < len; i++) {
          var leaf = node.leaf(i);
          if(!leaf.isToken()) {
            parse(leaf, res, param);
          }
        }
        break;
    }
  }
}
function mmbexpr(node, res, param) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken()) {
      var me = first.token().content();
      if(me == 'this' || param.thisHash.hasOwnProperty(me)) {
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
              parse(expr.last(), res, param);
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
              parse(expr, res, param);
            }
          }
        }
      }
      else if(param.thisModelHash.hasOwnProperty(me)) {
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
      else if(param.varHash.hasOwnProperty(me)) {
        res[param.varHash[me]] = true;
      }
      else {
        var bracket = node.leaf(1);
        if(bracket.isToken()) {
          if(bracket.token().content() == '[') {
            var expr = bracket.next();
            if(expr.name() == Node.EXPR) {
              parse(expr.last(), res, param);
            }
            else {
              parse(expr, res, param);
            }
          }
        }
      }
    }
    else if(first.name() == Node.CPEAPL) {
      parse(first, res, param);
    }
  }
  else if(prmr.name() == Node.MMBEXPR) {
    mmbexpr(prmr, res, param);
    var dot = prmr.next();
    if(dot.isToken() && dot.token().content() == '[') {
      var expr = dot.next();
      if(expr.name() == Node.EXPR) {
        parse(expr.last(), res, param);
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
        parse(expr, res, param);
      }
    }
  }
  else {
    parse(prmr, res, param);
  }
}
function callexpr(node, res, param) {
  parse(node.first(), res, param);
  var args = node.last();
  if(args.name() == Node.ARGS) {
    args.leaf(1).leaves().forEach(function(leaf, i) {
      if(i % 2 == 0) {
        parse(leaf, res, param);
      }
    });
  }
}

function arrltr(node, res, param) {
  node.leaves().forEach(function(leaf, i) {
    if(i % 2 == 1) {
      if(!leaf.isToken()) {
        parse(leaf, res, param);
      }
    }
  });
}

function cpeapl(node, res, param) {
  if(node.size() > 2) {
    var leaf = node.leaf(1);
    if(!leaf.isToken()) {
      parse(leaf, res, param);
    }
  }
}

exports["default"]=function(node, param) {
  var res = {};
  //取得全部this.xxx
  parse(node, res, param);
  var arr = Object.keys(res);
  arr = arr.filter(function(item) {
    //model.xxx全部通过
    if(item.indexOf('model.') == 0) {
      return true;
    }
    //没get不通过
    if(!(param.getHash || {}).hasOwnProperty(item)) {
      return false;
    }
    //有get需要有bind或link
    return (param.bindHash || {}).hasOwnProperty(item) || (param.linkHash || {}).hasOwnProperty(item);
  });
  return arr;
};
});