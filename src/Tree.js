import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class Tree {
  constructor() {
    this.res = '';
  }

  parse(node) {
    this.recursion(node);
    return this.res;
  }
  recursion(node, inClass, inRender, setHash = {}, getHash = {}) {
    var self = this;
    var isToken = node.isToken();
    if(isToken) {
      var token = node.token();
      if(token.isVirtual()) {
        return;
      }
      if(!token.ignore) {
        this.res += token.content();
      }
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
          break;
        }
        if(!token.ignore) {
          this.res += token.content();
        }
      }
    }
    else {
      switch(node.name()) {
        case Node.JSXElement:
        case Node.JSXSelfClosingElement:
          this.res += jsx(node, inClass, inRender, setHash, getHash);
          return;
        case Node.CLASSDECL:
          inClass = this.klass(node);
          break;
        case Node.CLASSBODY:
          if(inClass) {
            this.list(node, setHash, getHash);
          }
          break;
        case Node.METHOD:
          inRender = this.method(node);
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, inClass, inRender, setHash, getHash);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node, inClass, inRender, setHash, getHash);
          break;
      }
    }
  }
  klass(node) {
    var heritage = node.leaf(2);
    if(heritage && heritage.name() == Node.HERITAGE) {
      var mmb = heritage.leaf(1);
      if(mmb.name() == Node.MMBEXPR) {
        var prmr = mmb.first();
        if(prmr.name() == Node.PRMREXPR) {
          var token = prmr.first();
          if(token.isToken() && token.token().content() == 'migi') {
            token = mmb.leaf(1);
            if(token.isToken() && token.token().content() == '.') {
              return true;
            }
          }
        }
      }
    }
  }
  method(node) {
    var first = node.first();
    if(first.name() == Node.PROPTNAME) {
      first = first.first();
      if(first.name() == Node.LTRPROPT) {
        first = first.first();
        if(first.isToken() && first.token().content() == 'render') {
          return true;
        }
      }
    }
  }
  fnbody(node, inClass) {
    if(!inClass) {
      return;
    }
    var parent = node.parent();
    if(parent.name() == Node.METHOD) {
      var first = parent.first();
      if(first.isToken() && first.token().content() == 'set') {
        var top = parent.parent().parent().parent();
        var heritage = top.leaf(2);
        if(heritage.name() == Node.HERITAGE) {
          var mmb = heritage.leaf(1);
          if(mmb.name() == Node.MMBEXPR) {
            var prmr = mmb.first();
            if(prmr.name() == Node.PRMREXPR) {
              var token = prmr.first();
              if(token.isToken() && token.token().content() == 'migi') {
                token = mmb.last();
                if(token.isToken()) {
                  this.res += 'this.emit(migi.Event.DATA,"';
                  var name = parent.leaf(1).first().first().token().content();
                  this.res += name;
                  this.res += '");';
                }
              }
            }
          }
        }
      }
    }
  }
  list(node, setHash, getHash) {
    node.leaves().forEach(function(leaf) {
      if(leaf.name() == Node.CLASSELEM) {
        var method = leaf.first();
        if(method.name() == Node.METHOD) {
          var first = method.first();
          if(first.isToken()) {
            var token = first.token();
            if(token.content() == 'set') {
              var name = first.next().first().first().token().content();
              setHash[name] = true;
            }
            else if(token.content() == 'get') {
              var name = first.next().first().first().token().content();
              var param = first.next().next().next();
              param.leaves().forEach(function(leaf, i) {
                if(i % 2 == 0 && leaf.name() == Node.SINGLENAME) {
                  first = leaf.first();
                  if(first.name() == Node.BINDID) {
                    first = first.first();
                    if(first.isToken()) {
                      getHash[name] = getHash[name] || [];
                      getHash[name].push(first.token().content());
                    }
                  }
                }
              });
            }
          }
        }
      }
    });
  }
}

export default Tree;