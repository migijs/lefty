define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("default")?_0["default"]:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("default")?_1["default"]:_1}();
var Tree=function(){var _2=require('./Tree');return _2.hasOwnProperty("default")?_2["default"]:_2}();
var jsx=function(){var _3=require('./jsx');return _3.hasOwnProperty("default")?_3["default"]:_3}();
var join2=function(){var _4=require('./join2');return _4.hasOwnProperty("default")?_4["default"]:_4}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res;

function mmbexpr() {}

function varstmt(node, varHash, modelHash, thisHash, thisModelHash) {
  node.leaves().forEach(function(leaf) {
    if([Node.VARDECL, Node.LEXBIND].indexOf(leaf.name()) > -1) {
      var id = leaf.first().first();
      if(id.isToken()) {
        id = id.token().content();
        var prmr = leaf.leaf(1);
        if(!prmr) {
          return;
        }
        prmr = prmr.leaf(1);
        if(prmr.name() == Node.PRMREXPR) {
          var v = prmr.first();
          if(!v.isToken()) {
            return;
          }
          v = v.token().content();
          if(v == 'this' || thisHash.hasOwnProperty(v)) {
            thisHash[id] = true;
          }
        }
        else if(prmr.name() == Node.MMBEXPR) {
          prmr = prmr.first();
          if(prmr.name() == Node.PRMREXPR) {
            var v = prmr.first().token().content();
            if(v == 'this' || thisHash.hasOwnProperty(v)) {
              var dot = prmr.next();
              if(dot.isToken()) {
                if(dot.token().content() == '.') {
                  v = dot.next().token().content();
                  //this.model
                  if(v == 'model') {
                    thisModelHash[id] = true;
                  }
                  else {
                    varHash[id] = v;
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
              if(v == 'this' || thisHash.hasOwnProperty(v)) {
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
                            modelHash[id] = v.val();
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

function stmt(node, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
  switch(node.name()) {
    case Node.VARSTMT:
    case Node.LEXDECL:
      varstmt(node, varHash, modelHash, thisHash, thisModelHash);
      break;
  }
  recursion(node, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
}

function recursion(node, setHash, getHash, varHash, modelHash, thisHash, thisModelHash) {
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
        res += jsx(node, true, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
        return;
      case Node.FNEXPR:
      case Node.FNDECL:
      case Node.CLASSEXPR:
        var tree = new Tree();
        res += tree.parse(node);
        return;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
    });
  }
}

function parse(node, setHash, getHash) {
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
  res = '';

  //存this.get/set
  var varHash = {};
  //存this.model.x
  var modelHash = {};
  //存this
  var thisHash = {};
  //存this.model
  var thisModelHash = {};

  var len = node.size();
  node.leaves().forEach(function(leaf, i) {
    //fnbody
    if(i == len - 2) {
      leaf.leaves().forEach(function(item) {
        stmt(item, setHash, getHash, varHash, modelHash, thisHash, thisModelHash);
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