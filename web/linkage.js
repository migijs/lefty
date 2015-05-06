define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

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
    case Node.CALLEXPR:
      parse(node.first(), res);
      break;
  }
}
function mmbexpr(node, res) {
  var prmr = node.first();
  if(prmr.name() == Node.PRMREXPR) {
    var first = prmr.first();
    if(first.isToken() && first.token().content() == 'this') {
      var dot = node.leaf(1);
      if(dot.isToken() && dot.token().content() == '.') {
        var id = node.last().token().content();
        res[id] = true;
      }
    }
  }
}

exports.default=function(node) {
  var res = {};
  parse(node, res);
  return Object.keys(res);
};});