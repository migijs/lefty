import homunculus from 'homunculus';
import ignore from './ignore';
import Tree from './Tree';
import jsx from './jsx';
import join2 from './join2';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res;
function varstmt(node, param) {
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
          if(v == 'this' || param.thisHash.hasOwnProperty(v)) {
            param.thisHash[id] = true;
          }
        }
        else if(prmr.name() == Node.MMBEXPR) {
          prmr = prmr.first();
          if(prmr.name() == Node.PRMREXPR) {
            var v = prmr.first().token().content();
            if(v == 'this' || param.thisHash.hasOwnProperty(v)) {
              var dot = prmr.next();
              if(dot.isToken()) {
                if(dot.token().content() == '.') {
                  v = dot.next().token().content();
                  //this.model
                  if(v == 'model') {
                    param.thisModelHash[id] = true;
                  }
                  else {
                    param.varHash[id] = v;
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
              if(v == 'this' || param.thisHash.hasOwnProperty(v)) {
                var dot = prmr.next();
                if(dot.isToken()) {
                  v = dot.next().token().content();
                  if(v == 'model') {
                    dot = mmb.next();
                    if(dot.isToken()) {
                      if(dot.token().content() == '.') {
                        v = dot.next().token().content();
                        param.modelHash[id] = v;
                      }
                      else if(dot.token().content() == '[') {
                        v = dot.next();
                        if(v.name() == Node.PRMREXPR) {
                          v = v.first().token();
                          if(v.type() == Token.STRING) {
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
  switch(node.name()) {
    case Node.VARSTMT:
    case Node.LEXDECL:
      varstmt(node, param);
      break;
  }
  recursion(node, param);
}

function recursion(node, param) {
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
        res += jsx(node, true, param);
        return;
      case Node.FNEXPR:
      case Node.FNDECL:
      case Node.CLASSEXPR:
        var tree = new Tree();
        res += tree.parse(node);
        return;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, param);
    });
  }
}

function parse(node, param) {
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree['default'];
  }
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
  node.leaves().forEach(function(leaf, i) {
    //fnbody
    if(i == len - 2) {
      leaf.leaves().forEach(function(item) {
        stmt(item, param);
      });
    }
    else {
      res += join2(leaf);
    }
  });
  return res;
}

export default parse;
