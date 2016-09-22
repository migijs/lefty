var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var lefty = require('../');

describe('api', function() {
  it('#parse', function() {
    expect(lefty.parse).to.be.a(Function);
  });
});

describe('simple', function() {
  it('html tag lower', function() {
    var s = '<div>test</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],["test"])');
  });
  it('Component tag upper', function() {
    var s = '<Cmpt>test</Cmpt>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createCp(Cmpt,[],["test"])');
  });
  it('no children', function() {
    var s = '<div></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[])');
  });
  it('child is a var', function() {
    var s = '<div>{test}</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[test])');
  });
  it('multi children', function() {
    var s = '<div>t1{test}t2</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],["t1",test,"t2"])');
  });
  it('multi var children', function() {
    var s = '<div>{t1}{test}t2</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[t1,test,"t2"])');
  });
  it('nest html', function() {
    var s = '<div>text<p><span>xxx</span></p></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],["text",migi.createVd("p",[],[migi.createVd("span",[],["xxx"])])])');
  });
  it('props', function() {
    var s = '<a href="#">link</a>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("a",[["href","#"]],["link"])');
  });
  it('prop with -', function() {
    var s = '<div data-test="-"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[["data-test","-"]],[])');
  });
  it('multi props', function() {
    var s = '<div class="c" title="title"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[["class","c"],["title","title"]],[])');
  });
  it('self close', function() {
    var s = '<img src="xxx"/>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("img",[["src","xxx"]])');
  });
  it('close error', function() {
    var s = '<img src="xxx">';
    expect(function() {
      lefty.parse(s);
    }).to.throwError();
  });
  it('parse use es6', function() {
    var s = 'const a = <div/>';
    var res = lefty.parse(s, true);
    expect(res).to.eql('var a = migi.createVd("div",[])');
  });
  it('tag blank', function() {
    var s = '<div> {ttt }</div >';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[ ttt ]) ');
  });
  it('virtual', function() {
    var s = '<div />;';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[]);');
  });
  it('quote', function() {
    var s = '<img src={"test"\n}/>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("img",[["src","test"\n]])');
  });
  it('blank', function() {
    var s = '<div> </div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[" "])');
  });
  it('line', function() {
    var s = '<div>\n</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],["\\\n"])');
  });
  it('blank between tag', function() {
    var s = '<div> <span/>\n</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[ migi.createVd("span",[])\n])');
  });
});

describe('classes', function() {
  it('class', function() {
    var s = 'class A{render(){return <div/>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{render(){return migi.createVd("div",[])}}');
  });
  it('no constructor', function() {
    var s = 'class A{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{set t(){}get t(){}render(){return migi.createVd("p",[],[this.t])}}');
  });
  it('not extends', function() {
    var s = 'class A{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{constructor(){}set t(){}get t(){}render(){return migi.createVd("p",[],[this.t])}}');
  });
  it('get/set', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t)})])}}A.__migiName="A";');
  });
  it('no set', function() {
    var s = 'class A extends migi.xxx{constructor(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get t(){}render(){return migi.createVd("p",[],[this.t])}}A.__migiName="A";');
  });
  it('no get', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(v){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(v){;this.__data("t")}render(){return migi.createVd("p",[],[this.t])}}A.__migiName="A";');
  });
  it('get from others', function() {
    var s = 'class A extends migi.xxx{constructor(){}set v1(v){}set v2(v){}get t(v1,v2){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set v1(v){;this.__data("v1")}set v2(v){;this.__data("v2")}get t(v1,v2){}render(){return migi.createVd("p",[],[new migi.Obj(["v1","v2"],this,function(){return(this.t)})])}}A.__migiName="A";');
  });
  it('extends from custom', function() {
    var s = 'class A extends X{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){}set t(){;this instanceof migi.Component&&this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t)})])}}A.__migiName="A";');
  });
});

describe('linkage', function() {
  it('cndtexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{1?this.t:""}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(1?this.t:"")})])}}A.__migiName="A";');
  });
  it('mmbexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t.a)})])}}A.__migiName="A";');
  });
  it('mmbexpr []', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this["t"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this["t"])})])}}A.__migiName="A";');
  });
  it('this[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this[this.t])})])}}A.__migiName="A";');
  });
  it('this[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this[a,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this[a,this.t])})])}}A.__migiName="A";');
  });
  it('this.mmbexpr[this.mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set d(){}get d(){}set t(){}get t(){}render(){return <p>{this.d[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set d(){;this.__data("d")}get d(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj(["d","t"],this,function(){return(this.d[this.t])})])}}A.__migiName="A";');
  });
  it('[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a[this.t])})])}}A.__migiName="A";');
  });
  it('a.b[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a.b[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a.b[this.t])})])}}A.__migiName="A";');
  });
  it('[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a[b,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a[b,this.t])})])}}A.__migiName="A";');
  });
  it('newexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{new this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new this.t)})])}}A.__migiName="A";');
  });
  it('postfixexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t--}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t--)})])}}A.__migiName="A";');
  });
  it('arrltr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return([this.t])})])}}A.__migiName="A";');
  });
  it('callexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{fn(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(fn(this.t))})])}}A.__migiName="A";');
  });
  it('addexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t+1)})])}}A.__migiName="A";');
  });
  it('addexpr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{0+this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(0+this.t+1)})])}}A.__migiName="A";');
  });
  it('&&expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a||this.t)})])}}A.__migiName="A";');
  });
  it('&&expr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a||b||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a||b||this.t)})])}}A.__migiName="A";');
  });
  it('onEvent', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",xxx]],[])}}A.__migiName="A";');
  });
  it('cb event', function() {
    var s = 'class A extends migi.xxx{constructor(){}cb(){}render(){return <p onClick={this.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}cb(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this,this.cb)]],[])}}A.__migiName="A";');
  });
  it('explicit', function() {
    var s = 'class Person extends migi.Component{constructor(){}get name(first,last){}set first(v){}set last(v){}render(){return(<p>{this.name}</p>);}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class Person extends migi.Component{constructor(){}get name(first,last){}set first(v){;this.__data("first")}set last(v){;this.__data("last")}render(){return(migi.createVd("p",[],[new migi.Obj(["first","last"],this,function(){return(this.name)})]));}}Person.__migiName="Person";');
  });
  it('(expr)', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return((this.t))})])}}A.__migiName="A";');
  });
  it('model .', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(this.model.a)})])}}A.__migiName="A";');
  });
  it('model [', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(this.model["a"])})])}}A.__migiName="A";');
  });
  it('model event', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={this.model.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this.model,this.model.cb)]],[])}}A.__migiName="A";');
  });
  it('rest', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...rest}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[rest],[])}}A.__migiName="A";');
  });
  it('rest multi', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...a}{...b}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[a,b],[])}}A.__migiName="A";');
  });
  it('rest multi 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...a}c="1"{...b}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[a,["c","1"],b],[])}}A.__migiName="A";');
  });
  it('delegate', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={{a:a,"b":this.b}}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",[[{"a":{"_v":true}},a],[{"b":{"_v":true}},new migi.Cb(this,this.b)]]]],[])}}A.__migiName="A";');
  });
  it('state', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.state.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[],[new migi.Obj("state",this,function(){return(this.state.a)})])}}A.__migiName="A";');
  });
  it('only get state', function() {
    var s = 'class A extends migi.xxx{constructor(){}get state(){}render(){return <p>{this.state.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get state(){}render(){return migi.createVd("p",[],[this.state.a])}}A.__migiName="A";');
  });
  it('only set state', function() {
    var s = 'class A extends migi.xxx{constructor(){}set state(v){}render(){return <p>{this.state.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set state(v){;this.__data("state")}render(){return migi.createVd("p",[],[this.state.a])}}A.__migiName="A";');
  });
  it('new expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{new B(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new B(this.t))})])}}A.__migiName="A";');
  });
  it('new expr2', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{new B(a,...this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new B(a,...this.t))})])}}A.__migiName="A";');
  });
});

describe('var this/model', function() {
  it('var', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this.a;return <p>{b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this.a;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(b)})])}}A.__migiName="A";');
  });
  it('this', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this;return <p>{b.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(b.a)})])}}A.__migiName="A";');
  });
  it('this2', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this;var c = b;return <p>{c.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this;var c = b;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(c.a)})])}}A.__migiName="A";');
  });
  it('this3', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this;return <p>{b["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(b["a"])})])}}A.__migiName="A";');
  });
  it('this4', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this;var c = b;return <p>{c["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this;var c = b;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(c["a"])})])}}A.__migiName="A";');
  });
  it('this5', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){var b = this.a;return <p>{b.a.c}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){var b = this.a;return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(b.a.c)})])}}A.__migiName="A";');
  });
  it('var model.x', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this.model.a;return <p>{b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this.model.a;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(b)})])}}A.__migiName="A";');
  });
  it('var model[x]', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this.model["a"];return <p>{b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this.model["a"];return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(b)})])}}A.__migiName="A";');
  });
  it('var model this, var.model.x', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this;return <p>{b.model.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(b.model.a)})])}}A.__migiName="A";');
  });
  it('var model this, var.model["x"]', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this;return <p>{b.model.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(b.model.a)})])}}A.__migiName="A";');
  });
  it('var model this, var.x', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this.model;return <p>{b.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this.model;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(b.a)})])}}A.__migiName="A";');
  });
  it('var this, var model.x', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this;var c = b.model;return <p>{c.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this;var c = b.model;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(c.a)})])}}A.__migiName="A";');
  });
  it('var this, var model["x"]', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var b = this;var c = b.model;return <p>{c["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var b = this;var c = b.model;return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(c["a"])})])}}A.__migiName="A";');
  });
  it('other', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){return <p>{this.a?1:<b>1</b>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(this.a?1:migi.createVd("b",[],["1"]))})])}}A.__migiName="A";');
  });
  it('fnexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){{b.map(function(){return this.a})};return <p>1</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){{b.map(function(){return this.a})};return migi.createVd("p",[],["1"])}}A.__migiName="A";');
  });
  it('inner fn', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}set a(v){}render(){return <p>{b.map(function(){return this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){}set a(v){;this.__data("a")}render(){return migi.createVd("p",[],[b.map(function(){return this.a})])}}A.__migiName="A";');
  });
  it('exception', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var a=[];var b;return <p></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var a=[];var b;return migi.createVd("p",[],[])}}A.__migiName="A";');
  });
});
