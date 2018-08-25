import homunculus from 'homunculus';
import linkage from './linkage';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

function parse(node, res, param, opt) {
  switch(node.name()) {
    case Node.EXPRSTMT:
      linkage(node.first(), param, opt).arr.forEach((item) => {
        res[item] = true;
      });
      break;
    case Node.VARSTMT:
      node.leaves().forEach((leaf, i) => {
        if(i % 2 === 1) {
          let initlz = leaf.leaf(1);
          let temp = linkage(initlz.leaf(1), param, opt);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      });
      break;
    case Node.BLOCKSTMT:
      let block = node.first();
      for(let i = 1, leaves = block.leaves(); i < leaves.length - 1; i++) {
        parse(leaves[i], res, param, opt);
      }
      break;
    case Node.IFSTMT:
      let condition = node.leaf(2);
      linkage(condition, param, opt).arr.forEach((item) => {
        res[item] = true;
      });
      parse(node.last(), res, param, opt);
      break;
    case Node.ITERSTMT:
      let peek = node.first().token().content();
      if(peek === 'for') {
        let first = node.leaf(2);
        // for(;...
        if(first.isToken()) {}
        else {
          if(first.name() === Node.LEXDECL) {
            parse(first, res, param, opt);
          }
          else if(first.name() === Node.VARSTMT) {
            parse(first, res, param, opt);
          }
        }
        let second = node.leaf(3);
        // for(;;...
        if(second.isToken()) {}
        else {
          let temp = linkage(second, param, opt);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
        let third = node.leaf(4);
        if(third.isToken()) {
          third = node.leaf(5);
          if(third.isToken()) {}
          else {
            let temp = linkage(third, param, opt);
            temp.arr.forEach((item) => {
              res[item] = true;
            });
          }
        }
        else {
          let temp = linkage(third, param, opt);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      }
      else if(peek === 'do') {
        let blockstmt = node.leaf(1);
        parse(blockstmt, res, param, opt);
        let temp = linkage(node.leaf(4), param, opt);
        temp.arr.forEach((item) => {
          res[item] = true;
        });
      }
      else if(peek === 'while') {
        let temp = linkage(node.leaf(2), param, opt);
        temp.arr.forEach((item) => {
          res[item] = true;
        });
        let stmt = node.last();
        parse(stmt, res, param, opt);
      }
      break;
    case Node.LEXDECL:
      node.leaves().forEach((leaf, i) => {
        if(i % 2 === 1) {
          let initlz = leaf.leaf(1);
          let temp = linkage(initlz.leaf(1), param, opt);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
        }
      });
      break;
    case Node.RETSTMT:
      // 第一层arrowFn的return语句不包含在linkage中，还有递归return的arrowFn也是
      if(opt.arrowFn.length > 0) {
        let allReturn = true;
        for(let i = 0, len = opt.arrowFn.length; i < len; i++) {
          if(!opt.arrowFn[i]) {
            allReturn = false;
            break;
          }
        }
        if(!allReturn) {
          linkage(node.leaf(1), param, opt).arr.forEach((item) => {
            res[item] = true;
          });
        }
      }
      break;
    case Node.WITHSTMT:
      linkage(node.leaf(2), param, opt).arr.forEach((item) => {
        res[item] = true;
      });
      let blockstmt = node.last();
      parse(blockstmt, res, param, opt);
      break;
    case Node.SWCHSTMT:
      linkage(node.leaf(2), param, opt).arr.forEach((item) => {
        res[item] = true;
      });
      let caseblock = node.last();
      parse(caseblock, res, param, opt);
      break;
    case Node.CASEBLOCK:
      let leaves = node.leaves();
      for(let i = 1; i < leaves.length - 1; i++) {
        let leaf = leaves[i];
        if(leaf.name() === Node.CASECLAUSE) {
          let expr = leaf.leaf(1);
          let temp = linkage(expr, param, opt);
          temp.arr.forEach((item) => {
            res[item] = true;
          });
          parse(leaf.last(), res, param, opt);
        }
        else if(leaf.name() === Node.DFTCLAUSE) {
          parse(leaf.last(), res, param, opt);
        }
      }
      break;
  }
}

export default function(node, res, param, opt) {
  node.leaves().forEach((leaf) => {
    parse(leaf, res, param, opt);
  });
};
