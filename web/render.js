define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var jsx=function(){var _2=require('./jsx');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var join2=function(){var _3=require('./join2');return _3.hasOwnProperty("default")?_3["default"]:_3}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res;

function varstmt(node, varHash, modelHash, thisHash) {
  node.leaves().forEach(function(leaf) {
    if([Node.VARDECL, Node.LEXBIND].indexOf(leaf.name()) > -1) {
      var id = leaf.first().first();
      if(id.isToken()) {
        id = id.token().content();
        var prmr = leaf.leaf(1).leaf(1);
        if(prmr.name() == Node.PRMREXPR) {
          var v = prmr.first().token().content();
          if(v == 'this') {
            thisHash[id] = true;
          }
        }
        else if(prmr.name() == Node.MMBEXPR) {
          prmr = prmr.first();
          if(prmr.name() == Node.PRMREXPR) {
            var v = prmr.first().token().content();
            if(v == 'this') {
              var dot = prmr.next();
              if(dot.isToken()) {
                if(dot.token().content() == '.') {
                  v = dot.next().token().content();
                  varHash[id] = v;
                }
                else if(dot.token().content() == '[') {
                  v = dot.next();
                  if(v.name() == Node.PRMREXPR) {
                    v = v.first().token();
                    if(v.type() == Token.STRING) {
                      varHash[id] = v.val();
                    }
                  }
                }
              }
            }
          }
          //this.model.x
          else if(prmr.name() == Node.MMBEXPR) {
            var mmb = prmr;
            prmr = prmr.first();
            if(prmr.name() == Node.PRMREXPR) {
              var v = prmr.first().token().content();
              if(v == 'this') {
                var dot = prmr.next();
                if(dot.isToken()) {
                  v = dot.next().token().content();
                  if(v == 'model') {
                    dot = mmb.next();
                    if(dot.isToken()) {
                      if(dot.token().content() == '.') {
                        v = dot.next().token().content();
                        modelHash[id] = v;
                      }
                      else if(dot.token().content() == '[') {
                        v = dot.next();
                        if(v.name() == Node.PRMREXPR) {
                          v = v.first().token();
                          if(v.type() == Token.STRING) {
                            varHash[id] = v.val();
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

function stmt(node, setHash, getHash, varHash, modelHash, thisHash) {
  if(node.isToken()) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    if(!token.ignore) {
      res += token.content();
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      if(!token.ignore) {
        res += token.content();
      }
    }
  }
  else {
    switch(node.name()) {
      case Node.VARSTMT:
      case Node.LEXDECL:
        varstmt(node, varHash, modelHash, thisHash);
        break;
    }
    //res += jsx(node, true, setHash, getHash, varHash, modelHash, thisHash);
    recursion(node, setHash, getHash, varHash, modelHash, thisHash);
  }
}

function recursion(node, setHash, getHash, varHash, modelHash, thisHash) {
  if(node.isToken()) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    if(!token.ignore) {
      res += token.content();
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      if(!token.ignore) {
        res += token.content();
      }
    }
  }
  else {
    switch(node.name()) {
      case Node.JSXElement:
      case Node.JSXSelfClosingElement:
        res += jsx(node, true, setHash, getHash, varHash, modelHash, thisHash);
        return;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, setHash, getHash, varHash, modelHash, thisHash);
    });
  }
}

function parse(node, setHash, getHash) {
  res = '';
  var varHash = {};
  var modelHash = {};
  var thisHash = {};
  var len = node.size();
  node.leaves().forEach(function(leaf, i) {
    //fnbody
    if(i == len - 2) {
      leaf.leaves().forEach(function(item) {
        stmt(item, setHash, getHash, varHash, modelHash, thisHash);
      });
    }
    else {
      res += join2(leaf);
    }
  });
  return res;
}

exports["default"]=parse;
});