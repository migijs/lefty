import homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'jsx');
var Node = homunculus.getClass('node', 'jsx');

function parse(node, res) {
  switch(node.name()) {
    case Node.MMBEXPR:
      mmbexpr(node, res);
      break;
    case Node.CNDTEXPR:
      parse(node.first(), res);
      parse(node.leaf(2), res);
      parse(node.last(), res);
      break;
    case Node.LOGOREXPR:
    case Node.LOGANDEXPR:
    case Node.BITANDEXPR:
    case Node.BITOREXPR:
    case Node.BITXOREXPR:
    case Node.EQEXPR:
    case Node.RELTEXPR:
    case Node.SHIFTEXPR:
    case Node.ADDEXPR:
    case Node.MTPLEXPR:
      parse(node.first(), res);
      parse(node.last(), res);
      break;
    case Node.UNARYEXPR:
    case Node.NEWEXPR:
      parse(node.last(), res);
      break;
    case Node.POSTFIXEXPR:
      parse(node.first(), res);
    case Node.CALLEXPR:
      callexpr(node, res);
      break;
  }
}
function mmbexpr(node, res) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken() && first.token().content() == 'this') {
      var dot = node.leaf(1);
      if(dot.isToken()) {
        if(dot.token().content() == '.') {
          var id = node.last().token().content();
          res[id] = true;
        }
        else if(dot.token().content() == '[') {
          var expr = dot.next();
          if(expr.name() == Node.EXPR) {
            parse(expr.last(), res);
          }
          else {
            parse(expr, res);
          }
        }
      }
    }
  }
}
function callexpr(node, res) {
  parse(node.first(), res);
  var args = node.last();
  if(args.name() == Node.ARGS) {
    args.leaf(1).leaves().forEach(function(leaf, i) {
      if(i % 2 == 0) {
        parse(leaf, res);
      }
    });
  }
}

export default function(node) {
  var res = {};
  parse(node, res);
  return Object.keys(res);
};