import homunculus from 'homunculus';
import Tree from './Tree';

class Lefty {
  constructor() {
    this.parser = null;
    this.node = null;
  }

  parse(code) {
    this.parser = homunculus.getParser('jsx');
    this.node = this.parser.parse(code);
    var tree = new Tree();
    return tree.parse(this.node);
  }

  tokens() {
    return this.ast ? this.parser.lexer.tokens() : null;
  }
  ast() {
    return this.node;
  }
}

export default new Lefty();
