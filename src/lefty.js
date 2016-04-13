import homunculus from 'homunculus';
import jsdc from 'jsdc';
import Tree from './Tree';

class Lefty {
  constructor() {
    this.parser = null;
    this.node = null;
  }

  parse(code, es5) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    var res = tree.parse(this.node);
    return es5 ? jsdc.parse(res) : res;
  }

  tokens() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  ast() {
    return this.node;
  }
  reset() {
    lowIe.reset();
  }
}

export default new Lefty();
