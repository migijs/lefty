import homunculus from 'homunculus';
import ignore from './ignore';
import klass from './klass';

var Token = homunculus.getClass('token', 'jsx');
var JsNode = homunculus.getClass('node', 'jsx');

function recursion(node, ids, inClass) {
  var isToken = node.isToken();
  if(isToken) {
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
      case JsNode.CLASSDECL:
        inClass = klassdecl(node);
        if(inClass) {
          return res += klass(node, ids);
        }
        break;
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ids, inClass);
    });
  }
}

function klassdecl(node) {
  var heritage = node.leaf(2);
  //必须有继承，但直接继承migi.xxx可判断，再继承无法得知，因此所有继承都追加
  if(heritage && heritage.name() == JsNode.HERITAGE) {
    return hasGS(node) && hasCons(node);
  }
}

function hasGS(node) {
  var body = node.last().prev();
  var og = {};
  var os = {};
  //判断有无get/set，有才追加
  body.leaves().forEach(function(leaf) {
    var method = leaf.first();
    if(method.name() == JsNode.METHOD) {
      var first = method.first();
      if(first.isToken()) {
        var token = first.token();
        var id = first.next();
        if(id.name() == JsNode.PROPTNAME) {
          id = id.first();
          if(id.name() == JsNode.LTRPROPT) {
            id = id.first();
            if(id.isToken()) {
              id = id.token().content();
              if(token.content() == 'get') {
                og[id] = true;
              }
              else if(token.content() == 'set') {
                os[id] = true;
              }
            }
          }
        }
      }
    }
  });
  var res = false;
  Object.keys(og).forEach(function(k) {
    if(!res && os.hasOwnProperty(k)) {
      res = true;
    }
  });
  return res;
}

function hasCons(node) {
  var body = node.last().prev();
  var leaves = body.leaves();
  for(var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    var method = leaf.first();
    if(method.name() == JsNode.METHOD) {
      var first = method.first();
      if(first.name() == JsNode.PROPTNAME) {
        var id = first.first();
        if(id.name() == JsNode.LTRPROPT) {
          id = id.first();
          if(id.isToken()) {
            id = id.token().content();
            if(id == 'constructor') {
              return true;
            }
          }
        }
      }
    }
  }
}

var res;

function parse(node, ids) {
  uid = 0;
  res = '';
  recursion(node, ids);
  return res;
}

export default parse;