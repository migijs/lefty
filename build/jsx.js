var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

var res = '';

function recursion(node) {
  if(node.isToken()) {
    var token = node.token();
    if(token.isVirtual()) {
      return;
    }
    while(token.next()) {
      token = token.next();
      if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
        break;
      }
      res += token.content();
    }
  }
  else {
    switch(node.name()) {
      //TODO
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf);
    });
  }
}

function parse(node) {
  res = '';
  recursion(node);
  return res;
}

exports.default=parse;