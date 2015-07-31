import homunculus from 'homunculus';
import jsdc from 'jsdc';
import Tree from './Tree';
import lowIe from './lowIe';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

class Lefty {
  constructor() {
    this.parser = null;
    this.node = null;
  }

  parse(code, lie, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    var res = tree.parse(this.node);
    if(lie) {
      var parser = homunculus.getParser('es6');
      var node = parser.parse(res);
      var lexer = parser.lexer;
      var ids = {};
      lexer.tokens().forEach(function(token) {
        if(token.type() == Token.ID) {
          var s = token.content();
          if(/^\d+$/.test(s)) {
            ids['_' + s] = true;
          }
        }
      });
      res = lowIe(node, ids);
    }
    return es5 ? jsdc.parse(res) : res;
  }
}

export default new Lefty();
