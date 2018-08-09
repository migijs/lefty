import homunculus from 'homunculus';
import linkage from './linkage';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res, param) {
  switch(node.name()) {
    case Node.EXPRSTMT:
      var temp = linkage(node.first(), param);
      temp.arr.forEach((item) => {
        res[item] = true;
      });
      break;
    case Node.VARSTMT:
      node.leaves().forEach((leaf, i) => {
        if(i % 2 == 1) {
          var initlz = leaf.leaf(1);
          var temp = linkage(initlz.leaf(1), param);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      });
      break;
    case Node.BLOCKSTMT:
      let block = node.first();
      for(var i = 1, leaves = block.leaves(); i < leaves.length - 1; i++) {
        parse(leaves[i], res, param);
      }
      break;
    case Node.IFSTMT:
      let condition = node.leaf(2);
      var temp = linkage(condition, param);
      temp.arr.forEach((item) => {
        res[item] = true;
      });
      parse(node.last(), res, param);
      break;
    case Node.ITERSTMT:
      let peek = node.first().token().content();
      if(peek == 'for') {
        let first = node.leaf(2);
        // for(;...
        if(first.isToken()) {}
        else {
          if(first.name() == Node.LEXDECL) {
            parse(first, res, param);
          }
          else if(first.name() == Node.VARSTMT) {
            parse(first, res, param);
          }
        }
        let second = node.leaf(3);
        // for(;;...
        if(second.isToken()) {}
        else {
          var temp = linkage(second, param);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
        let third = node.leaf(4);
        if(third.isToken()) {
          third = node.leaf(5);
          if(third.isToken()) {}
          else {
            var temp = linkage(third, param);
            temp.arr.forEach((item) => {
              res[item] = true;
            });
          }
        }
        else {
          var temp = linkage(third, param);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      }
      else if(peek == 'do') {
        let blockstmt = node.leaf(1);
        parse(blockstmt, res, param);
        var temp = linkage(node.leaf(4), param);
        temp.arr.forEach((item) => {
          res[item] = true;
        });
      }
      else if(peek == 'while') {
        var temp = linkage(node.leaf(2), param);
        temp.arr.forEach((item) => {
          res[item] = true;
        });
        let stmt = node.last();
        parse(stmt, res, param);
      }
      break;
    case Node.LEXDECL:
      node.leaves().forEach((leaf, i) => {
        if(i % 2 == 1) {
          var initlz = leaf.leaf(1);
          var temp = linkage(initlz.leaf(1), param);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      });
      break;
    case Node.RETSTMT:
      var expr = node.leaf(1);
      var temp = linkage(expr, param);
      temp.arr.forEach((item) => {
        res[item] = true;
      });
      break;
    case Node.WITHSTMT:
      var expr = node.leaf(2);
      var temp = linkage(expr, param);
      temp.arr.forEach((item) => {
        res[item] = true;
      });
      let blockstmt = node.last();
      parse(blockstmt, res, param);
      break;
    case Node.SWCHSTMT:
      var expr = node.leaf(2);
      var temp = linkage(expr, param);
      temp.arr.forEach((item) => {
        res[item] = true;
      });
      let caseblock = node.last();
      parse(caseblock, res, param);
      break;
    case Node.CASEBLOCK:
      var leaves = node.leaves();
      for(var i = 1; i < leaves.length - 1; i++) {
        var leaf = leaves[i];
        if(leaf.name() == Node.CASECLAUSE) {
          var expr = leaf.leaf(1);
          var temp = linkage(expr, param);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
          parse(leaf.last(), res, param);
        }
        else if(leaf.name() == Node.DFTCLAUSE) {
          parse(leaf.last(), res, param);
        }
      }
      break;
  }
}

export default function(node, res, param) {
  node.leaves().forEach((leaf) => {
    parse(leaf, res, param);
  });
};
