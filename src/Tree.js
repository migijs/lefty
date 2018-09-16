import homunculus from 'homunculus';
import jsx from './jsx';
import ignore from './ignore';
import render from './render';
import join2 from './join2';

let Token = homunculus.getClass('token', 'jsx');
let Node = homunculus.getClass('node', 'jsx');

class Tree {
  constructor() {
    this.res = '';
  }

  parse(node) {
    this.recursion(node, false);
    return this.res;
  }
  recursion(node, inClass) {
    let self = this;
    let isToken = node.isToken();
    if(isToken) {
      let token = node.token();
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
          this.res += jsx(node, {}, this.param);
          return;
        case Node.CLASSDECL:
          inClass = this.klass(node);
          break;
        case Node.CLASSBODY:
          if(inClass) {
            this.param = {
              getHash: {},
              setHash: {},
              evalHash: {},
              bindHash: {},
              linkHash: {},
              linkedHash: {},
            };
            this.list(node);
          }
          break;
        case Node.METHOD:
          let isRender = this.method(node);
          if(isRender) {
            this.res += render(node, this.param || {});
            return;
          }
          break;
        case Node.ANNOT:
          if(['@bind', '@eval', '@link'].indexOf(node.first().token().content()) > -1) {
            this.res += ignore(node, true).res;
          }
          else {
            this.res += join2(node);
          }
          break;
        case Node.LEXBIND:
          if(inClass && node.parent().name() === Node.CLASSELEM) {
            this.res += this.bindLex(node);
            return;
          }
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, inClass);
      });
      switch(node.name()) {
        case Node.FNBODY:
          this.fnbody(node, inClass);
          break;
        case Node.CLASSDECL:
          this.appendName(node);
          inClass = false;
          break;
      }
    }
  }
  klass(node) {
    let heritage = node.leaf(2);
    if(heritage && heritage.name() === Node.HERITAGE) {
      let body = node.last().prev();
      let leaves = body.leaves();
      for(let i = 0, len = leaves.length; i < len; i++) {
        let leaf = leaves[i];
        let method = leaf.first();
        if(method.name() === Node.METHOD) {
          let first = method.first();
          if(first.name() === Node.PROPTNAME) {
            let id = first.first();
            if(id.name() === Node.LTRPROPT) {
              id = id.first();
              if(id.isToken()) {
                id = id.token().content();
                if(id === 'constructor') {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }
  method(node) {
    let first = node.first();
    if(first.name() === Node.PROPTNAME) {
      first = first.first();
      if(first.name() === Node.LTRPROPT) {
        first = first.first();
        if(first.isToken() && first.token().content() === 'render') {
          return true;
        }
      }
    }
  }
  fnbody(node, inClass) {
    if(!inClass) {
      return;
    }
    let parent = node.parent();
    if(parent.name() === Node.METHOD) {
      let setV;
      let first = parent.first();
      if(first.isToken() && first.token().content() === 'set') {
        let fmparams = parent.leaf(3);
        if(fmparams && fmparams.name() === Node.FMPARAMS) {
          let single = fmparams.first();
          if(single && single.name() === Node.SINGLENAME) {
            let bindid = single.first();
            if(bindid && bindid.name() === Node.BINDID) {
              setV = bindid.first().token().content();
            }
          }
        }
        let name = parent.leaf(1).first().first().token().content();
        let prev = parent.parent().prev();
        let ids = [];
        if(prev) {
          prev = prev.first();
          if (prev.name() === Node.ANNOT && ['@bind', '@eval'].indexOf(prev.first().token().content()) > -1) {
            ids.push(name);
          }
        }
        ids = ids.concat(this.param.linkedHash[name] || []);
        if(ids.length) {
          if(setV) {
            if(ids.length === 1) {
              this.res += ';this.__array("';
              this.res += ids[0] + '",';
              this.res += setV;
              this.res += ')';
            }
            else {
              this.res += ';this.__array(["';
              this.res += ids.join('","') + '"],';
              this.res += setV;
              this.res += ')';
            }
          }
          if(ids.length === 1) {
            this.res += ';this.__data("';
            this.res += ids[0];
            this.res += '")';
          }
          else {
            this.res += ';this.__data(["';
            this.res += ids.join('","');
            this.res += '"])';
          }
        }
      }
    }
  }
  list(node) {
    let leaves = node.leaves();
    let length = leaves.length;
    for(let i = 0; i < length; i++) {
      let item = leaves[i].first();
      if(item.name() === Node.ANNOT) {
        let annot = item.first().token().content();
        let method = leaves[i+1] ? leaves[i+1].first() : null;
        if(method && method.name() === Node.METHOD) {
          let first = method.first();
          if(first.isToken()) {
            let token = first.token().content();
            if(token === 'set' && annot === '@bind') {
              let name = first.next().first().first().token().content();
              this.param.bindHash[name] = true;
            }
            else if(token === 'set' && annot === '@eval') {
              let name = first.next().first().first().token().content();
              this.param.evalHash[name] = true;
            }
            else if(token === 'get' && annot === '@link') {
              let name = first.next().first().first().token().content();
              this.param.linkHash[name] = this.param.linkHash[name] || [];
              let params = item.leaf(2);
              if(params && params.name() === Node.FMPARAMS) {
                params.leaves().forEach(function(param) {
                  if(param.name() === Node.SINGLENAME) {
                    param = param.first();
                    if(param.name() === Node.BINDID) {
                      param = param.first();
                      if(param.isToken()) {
                        param = param.token().content();
                        this.param.linkHash[name].push(param);
                        this.param.linkedHash[param] = this.param.linkedHash[param] || [];
                        this.param.linkedHash[param].push(name);
                      }
                    }
                  }
                }.bind(this));
              }
            }
          }
        }
        else if(method && method.name() === Node.LEXBIND) {
          let first = method.first();
          if(first.name() === Node.BINDID) {
            let name = first.first().token().content();
            parseLex(this.param, name, item, annot);
          }
        }
        //连续2个
        else if(method && method.name() === Node.ANNOT) {
          let item2 = method;
          let annot2 = method.first().token().content();
          method = leaves[i+2] ? leaves[i+2].first() : null;
          if(method && method.name() === Node.LEXBIND) {
            let first = method.first();
            if(first.name() === Node.BINDID) {
              let name = first.first().token().content();
              parseLex(this.param, name, item, annot);
              parseLex(this.param, name, item2, annot2);
            }
          }
        }
      }
      else if(item.name() === Node.METHOD) {
        let first = item.first();
        if(first.isToken()) {
          let token = first.token().content();
          let name = first.next().first().first().token().content();
          if(token === 'get') {
            this.param.getHash[name] = true;
          }
          else if(token === 'set') {
            this.param.setHash[name] = true;
          }
        }
      }
      else if(item.name() === Node.LEXBIND) {
        let first = item.first();
        if(first.name() === Node.BINDID) {
          let name = first.first().token().content();
          this.param.getHash[name] = true;
          this.param.setHash[name] = true;
        }
      }
    }
  }
  appendName(node) {
    let heritage = node.leaf(2);
    //必须有继承
    if(heritage && heritage.name() === Node.HERITAGE) {
      //必须有constructor
      if(hasCons(node)) {
        let name = node.leaf(1).first().token().content();
        this.res += 'migi.name(' + name + ',"' + name + '");';
      }
    }
  }
  bindLex(node) {
    let parent = node.parent();
    let bindid = node.first();
    if(bindid.name() === Node.BINDID) {
      let token = bindid.first();
      let name = token.token().content();
      let init = node.leaf(1);
      
      let ids = [];
      let prev = parent.prev();
      if(prev) {
        prev = prev.first();
        if(prev.name() === Node.ANNOT && ['@bind', '@eval'].indexOf(prev.first().token().content()) > -1) {
          ids.push(name);
        }
      }
      ids = ids.concat(this.param.linkedHash[name] || []);
      
      let s = '';
      s += 'set ' + name + '(v){';
      s += 'this.__setBind("' + name + '",v)';
      if(ids.length) {
        if(ids.length === 1) {
          s += ';this.__data("';
          s += ids[0];
          s += '")';
        }
        else {
          s += ';this.__data(["';
          s += ids.join('","');
          s += '"])';
        }
      }
      s += '}get ' + name + '(){';
      s += ignore(token).res;
      if(init) {
        s += 'if(this.__initBind("' + name + '"))';
        s += 'this.__setBind("' + name + '",';
        s += ignore(init.first()).res;
        s += join2(init.last());
        s += ');';
      }
      s += 'return this.__getBind("' + name + '")}';
      return s;
    }
  }
}

function hasCons(node) {
  let body = node.last().prev();
  let leaves = body.leaves();
  for(let i = 0, len = leaves.length; i < len; i++) {
    let leaf = leaves[i];
    let method = leaf.first();
    if(method.name() === Node.METHOD) {
      let first = method.first();
      if(first.name() === Node.PROPTNAME) {
        let id = first.first();
        if(id.name() === Node.LTRPROPT) {
          id = id.first();
          if(id.isToken()) {
            id = id.token().content();
            if(id === 'constructor') {
              return true;
            }
          }
        }
      }
    }
  }
}

function parseLex(param, name, item, annot) {
  if(annot === '@bind') {
    param.bindHash[name] = true;
  }
  else if(annot === '@eval') {
    param.evalHash[name] = true;
  }
  else if(annot === '@link') {
    param.linkHash[name] = param.linkHash[name] || [];
    let params = item.leaf(2);
    if(params && params.name() === Node.FMPARAMS) {
      params.leaves().forEach(function(item) {
        if(item.name() === Node.SINGLENAME) {
          item = item.first();
          if(item.name() === Node.BINDID) {
            item = item.first();
            if(item.isToken()) {
              item = item.token().content();
              param.linkHash[name].push(item);
              param.linkedHash[item] = param.linkedHash[item] || [];
              param.linkedHash[item].push(name);
            }
          }
        }
      });
    }
  }
}

export default Tree;