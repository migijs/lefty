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
    expect(res).to.eql('migi.createVd("div",[],["\\n\\\n"])');
  });
  it('line2', function() {
    var s = '<pre>a\nb</pre>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("pre",[],["a\\n\\\nb"])');
  });
  it('blank between tag', function() {
    var s = '<div> <span/>\n</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",[],[ migi.createVd("span",[])\n])');
  });
  it(':', function() {
    var s = '<wb:share-button></wb:share-button>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("wb:share-button",[],[])');
  });
});

describe('classes', function() {
  it('class', function() {
    var s = 'class A{render(){return <div/>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{render(){return migi.createVd("div",[])}}');
  });
  it('no constructor', function() {
    var s = 'class A extends B{set t(){}@bind get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends B{set t(){} get t(){}render(){return migi.createVd("p",[],[this.t])}}');
  });
  it('not extends', function() {
    var s = 'class A{constructor(){}set t(){}@bind get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{constructor(){}set t(){} get t(){}render(){return migi.createVd("p",[],[this.t])}}');
  });
  it('@bind', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t)},true)])}}migi.name(A,"A");');
  });
  it('no set', function() {
    var s = 'class A extends migi.xxx{constructor(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get t(){}render(){return migi.createVd("p",[],[this.t])}}migi.name(A,"A");');
  });
  it('no get', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(v){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(v){}render(){return migi.createVd("p",[],[this.t])}}migi.name(A,"A");');
  });
  it('@link', function() {
    var s = 'class A extends migi.xxx{constructor(){}set v1(v){}set v2(v){}@link(v1,v2)get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set v1(v){;this.__array("t",v);this.__data("t")}set v2(v){;this.__array("t",v);this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t)},true)])}}migi.name(A,"A");');
  });
  it('extends from custom', function() {
    var s = 'class A extends X{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t)},true)])}}migi.name(A,"A");');
  });
  it('ab.', function() {
    var s = 'class A extends X{constructor(){}b render(){return <p>{this.b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){}set b(v){this.__setBind("b",v)}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[this.b])}}migi.name(A,"A");');
  });
});

describe('linkage', function() {
  it('expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind t render(){return <p>{(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(v){this.__setBind("t",v);this.__data("t")}get t(){ return this.__getBind("t")}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return((this.t))},true)])}}migi.name(A,"A");');
  });
  it('expr2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind t @bind d render(){return <p>{(this.t,this.d)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(v){this.__setBind("t",v);this.__data("t")}get t(){ return this.__getBind("t")} set d(v){this.__setBind("d",v);this.__data("d")}get d(){ return this.__getBind("d")}render(){return migi.createVd("p",[],[new migi.Obj(["t","d"],this,function(){return((this.t,this.d))},true)])}}migi.name(A,"A");');
  });
  it('expr3', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind t render(){return <p>{(this.t,a)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(v){this.__setBind("t",v);this.__data("t")}get t(){ return this.__getBind("t")}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return((this.t,a))})])}}migi.name(A,"A");');
  });
  it('expr4', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind t render(){return <p>{(a,this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(v){this.__setBind("t",v);this.__data("t")}get t(){ return this.__getBind("t")}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return((a,this.t))},true)])}}migi.name(A,"A");');
  });
  it('cndtexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{1?this.t:""}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(1?this.t:"")})])}}migi.name(A,"A");');
  });
  it('mmbexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t.a)})])}}migi.name(A,"A");');
  });
  it('mmbexpr []', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this["t"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this["t"])})])}}migi.name(A,"A");');
  });
  it('this[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this[this.t])})])}}migi.name(A,"A");');
  });
  it('this[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this[a,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this[a,this.t])})])}}migi.name(A,"A");');
  });
  it('this.mmbexpr[this.mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set d(){}get d(){}@bind set t(){}get t(){}render(){return <p>{this.d[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set d(){;this.__data("d")}get d(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj(["d","t"],this,function(){return(this.d[this.t])})])}}migi.name(A,"A");');
  });
  it('[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{a[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a[this.t])})])}}migi.name(A,"A");');
  });
  it('a.b[mmbexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{a.b[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a.b[this.t])})])}}migi.name(A,"A");');
  });
  it('[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{a[b,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a[b,this.t])})])}}migi.name(A,"A");');
  });
  it('newexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{new this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new this.t)})])}}migi.name(A,"A");');
  });
  it('postfixexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t--}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t--)})])}}migi.name(A,"A");');
  });
  it('arrltr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return([this.t])})])}}migi.name(A,"A");');
  });
  it('callexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{fn(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(fn(this.t))})])}}migi.name(A,"A");');
  });
  it('addexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t+1)})])}}migi.name(A,"A");');
  });
  it('addexpr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{0+this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(0+this.t+1)})])}}migi.name(A,"A");');
  });
  it('&&expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{a||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a||this.t)})])}}migi.name(A,"A");');
  });
  it('&&expr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{a||b||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(a||b||this.t)})])}}migi.name(A,"A");');
  });
  it('onEvent', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",xxx]],[])}}migi.name(A,"A");');
  });
  it('on-Event', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p on-change={xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["on-change",xxx]],[])}}migi.name(A,"A");');
  });
  it('on-Event2', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p on-change={this.xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["on-change",new migi.Cb(this,this.xxx)]],[])}}migi.name(A,"A");');
  });
  it('on-Event3', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p on-change={function(){}}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["on-change",new migi.Cb(this,function(){})]],[])}}migi.name(A,"A");');
  });
  it('cb event', function() {
    var s = 'class A extends migi.xxx{constructor(){}cb(){}render(){return <p onClick={this.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}cb(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this,this.cb)]],[])}}migi.name(A,"A");');
  });
  it('cb function', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={function(){}}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this,function(){})]],[])}}migi.name(A,"A");');
  });
  it('cb in class', function() {
    var s = 'class A extends migi.xxx{constructor(){}f(){return <p onClick={a}></p>}render(){return <p></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}f(){return migi.createVd("p",[["onClick",a]],[])}render(){return migi.createVd("p",[],[])}}migi.name(A,"A");');
  });
  it('this.cb in class', function() {
    var s = 'class A extends migi.xxx{constructor(){}f(){return <p onClick={this.a}></p>}render(){return <p></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}f(){return migi.createVd("p",[["onClick",new migi.Cb(this,this.a)]],[])}render(){return migi.createVd("p",[],[])}}migi.name(A,"A");');
  });
  it('@link', function() {
    var s = 'class Person extends migi.Component{constructor(){}@link(first,last)get name(){}set first(v){}set last(v){}render(){return(<p>{this.name}</p>);}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class Person extends migi.Component{constructor(){}get name(){}set first(v){;this.__array("name",v);this.__data("name")}set last(v){;this.__array("name",v);this.__data("name")}render(){return(migi.createVd("p",[],[new migi.Obj("name",this,function(){return(this.name)},true)]));}}migi.name(Person,"Person");');
  });
  it('(expr)', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return((this.t))},true)])}}migi.name(A,"A");');
  });
  it('model .', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(this.model.a)})])}}migi.name(A,"A");');
  });
  it('model [', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[],[new migi.Obj("model.a",this,function(){return(this.model["a"])})])}}migi.name(A,"A");');
  });
  it('model cb', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={this.model.click}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this.model,this.model.click)]],[])}}migi.name(A,"A");');
  });
  it('rest', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...rest}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[rest],[])}}migi.name(A,"A");');
  });
  it('rest multi', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...a}{...b}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[a,b],[])}}migi.name(A,"A");');
  });
  it('rest multi 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p {...a}c="1"{...b}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[a,["c","1"],b],[])}}migi.name(A,"A");');
  });
  it('delegate', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={{a:a,"b":this.b}}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",[[{"a":{"_v":true}},a],[{"b":{"_v":true}},new migi.Cb(this,this.b)]]]],[])}}migi.name(A,"A");');
  });
  it('delegate2', function() {
    var s = 'migi.render(<p onClick={{a:a,"b":this.b}}></p>)';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.render(migi.createVd("p",[["onClick",[[{"a":{"_v":true}},a],[{"b":{"_v":true}},new migi.Cb(this,this.b)]]]],[]))');
  });
  it('delegate3', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={this.a}/>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",[["onClick",new migi.Cb(this,this.a)]])}}migi.name(A,"A");');
  });
  it('only get', function() {
    var s = 'class A extends migi.xxx{constructor(){}get state(){}render(){return <p>{this.state}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get state(){}render(){return migi.createVd("p",[],[this.state])}}migi.name(A,"A");');
  });
  it('only set', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set state(v){}render(){return <p>{this.state}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set state(v){;this.__array("state",v);this.__data("state")}render(){return migi.createVd("p",[],[this.state])}}migi.name(A,"A");');
  });
  it('new expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{new B(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new B(this.t))})])}}migi.name(A,"A");');
  });
  it('new expr2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{new B(a,...this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new B(a,...this.t))})])}}migi.name(A,"A");');
  });
  it('new expr3', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{new B(this.t).toString()}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(new B(this.t).toString())})])}}migi.name(A,"A");');
  });
  it('no recursion', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t?"-":<a>{this.t}</a>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t?"-":migi.createVd("a",[],[this.t]))})])}}migi.name(A,"A");');
  });
  it('recursion cb', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind set t(){}get t(){}render(){return <p>{this.t?"-":<a onClick={this.click}>{this.t}</a>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set t(){;this.__data("t")}get t(){}render(){return migi.createVd("p",[],[new migi.Obj("t",this,function(){return(this.t?"-":migi.createVd("a",[["onClick",new migi.Cb(this,this.click)]],[this.t]))})])}}migi.name(A,"A");');
  });
  it('ab.', function() {
    var s = 'class A extends X{constructor(){}@bind b render(){return <p>{this.b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj("b",this,function(){return(this.b)},true)])}}migi.name(A,"A");');
  });
  it('ab. 2', function() {
    var s = 'class A extends X{constructor(){}@link(c) b set c(){} render(){return <p>{this.b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set b(v){this.__setBind("b",v)}get b(){ return this.__getBind("b")}set c(){;this.__data("b")} render(){return migi.createVd("p",[],[new migi.Obj("b",this,function(){return(this.b)},true)])}}migi.name(A,"A");');
  });
  it('ab. 3', function() {
    var s = 'class A extends X{constructor(){}@link(c) b set c(v){} render(){return <p>{this.b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set b(v){this.__setBind("b",v)}get b(){ return this.__getBind("b")}set c(v){;this.__array("b",v);this.__data("b")} render(){return migi.createVd("p",[],[new migi.Obj("b",this,function(){return(this.b)},true)])}}migi.name(A,"A");');
  });
  it('cpeapl 1', function() {
    var s = 'class A extends X{constructor(){}@bind a render(){return <p>{(this.a)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return((this.a))},true)])}}migi.name(A,"A");');
  });
  it('cpeapl 2', function() {
    var s = 'class A extends X{constructor(){}@bind a render(){return <p>{(this.a).b}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return((this.a).b)})])}}migi.name(A,"A");');
  });
  it('cpeapl 3', function() {
    var s = 'class A extends X{constructor(){}@bind a render(){return <p>{(this.a || []).map(function(){})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return((this.a || []).map(function(){}))})])}}migi.name(A,"A");');
  });
  it('bind property', function() {
    var s = 'class A extends migi.x{constructor(){}@bind a render(){return <B @c={this.a} d={this.a}/>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.x{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createCp(B,[["c",new migi.Obj("a",this,function(){return(this.a )},true)],["d",this.a]])}}migi.name(A,"A");');
  });
  it('condition expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind set a(v){}render(){return <p>{this.a?1:<b>1</b>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){;this.__array("a",v);this.__data("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(this.a?1:migi.createVd("b",[],["1"]))})])}}migi.name(A,"A");');
  });
  it('fnexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind set a(v){}render(){{b.map(function(){return this.a})};return <p>1</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){;this.__array("a",v);this.__data("a")}render(){{b.map(function(){return this.a})};return migi.createVd("p",[],["1"])}}migi.name(A,"A");');
  });
  it('inner fn', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind set a(v){}render(){return <p>{b.map(function(){return this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){;this.__array("a",v);this.__data("a")}render(){return migi.createVd("p",[],[b.map(function(){return new migi.Obj("a",this,function(){return(this.a)})})])}}migi.name(A,"A");');
  });
  it('jsx', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind a @bind b render(){return <p>{this.a?<b>{this.b?1:2}</b>:3}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj(["a","b"],this,function(){return(this.a?migi.createVd("b",[],[this.b?1:2]):3)})])}}migi.name(A,"A");');
  });
  it('jsx attr', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind a @bind b render(){return <p>{this.a?<b b={this.b}/>:3}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj(["a","b"],this,function(){return(this.a?migi.createVd("b",[["b",this.b]]):3)})])}}migi.name(A,"A");');
  });
  it('jsx combo', function() {
    var s = 'class A extends migi.xxx{constructor(){}get a(){}@bind a @bind b render(){return <p>{1?<b>{this.b?1:2}</b>:<i p={this.a}/>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get a(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj(["b","a"],this,function(){return(1?migi.createVd("b",[],[this.b?1:2]):migi.createVd("i",[["p",this.a]]))})])}}migi.name(A,"A");');
  });
  it('bind inner', function() {
    var s = 'class A extends migi.x{constructor(){}@bind a render(){return <p>{true?<input value={this.a}/>:<input value={this.b}/>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.x{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(true?migi.createVd("input",[["value",new migi.Obj("a",this,function(){return(this.a)})]]):migi.createVd("input",[["value",this.b]]))})])}}migi.name(A,"A");');
  });
  it('bind inner 2', function() {
    var s = 'class A extends migi.x{constructor(){}@bind a render(){return <p>{true?<select value={this.a}/>:<select value={2}/>}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.x{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(true?migi.createVd("select",[["value",new migi.Obj("a",this,function(){return(this.a)})]]):migi.createVd("select",[["value",2]]))})])}}migi.name(A,"A");');
  });
  it('bind inner 3', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{true ? <textarea>{this.a}</textarea>:1}</p>;}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return(true ? migi.createVd("textarea",[],[new migi.Obj("a",this,function(){return(this.a)})]):1)})]);}}migi.name(A,"A");');
  });
});

describe('arrowfn', function() {
  it('exprstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{this.a}))})])}}migi.name(A,"A");');
  });
  it('varstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{var a=this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{var a=this.a}))})])}}migi.name(A,"A");');
  });
  it('blockstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{{this.a}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{{this.a}}))})])}}migi.name(A,"A");');
  });
  it('ifstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{if(this.a){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{if(this.a){}}))})])}}migi.name(A,"A");');
  });
  it('ifstmt2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{if(1){this.a}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{if(1){this.a}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt for', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{for(let a=this.a;;){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{for(let a=this.a;;){}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt for2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{for(let a=this.a;;){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{for(let a=this.a;;){}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt for3', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{for(;;this.a){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{for(;;this.a){}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt for var', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{for(var a=this.a;;){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{for(var a=this.a;;){}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt do', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{do{}while(this.a)})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{do{}while(this.a)}))})])}}migi.name(A,"A");');
  });
  it('iterstmt do2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{do{this.a}while(1)})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{do{this.a}while(1)}))})])}}migi.name(A,"A");');
  });
  it('iterstmt while', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{while(this.a){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{while(this.a){}}))})])}}migi.name(A,"A");');
  });
  it('iterstmt while2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{while(1){this.a}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{while(1){this.a}}))})])}}migi.name(A,"A");');
  });
  it('retstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{return this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[[].map(()=>{return new migi.Obj("a",this,function(){return(this.a)})})])}}migi.name(A,"A");');
  });
  it('withstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{with(this.a){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{with(this.a){}}))})])}}migi.name(A,"A");');
  });
  it('swtchstmt', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{switch(this.a){}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{switch(this.a){}}))})])}}migi.name(A,"A");');
  });
  it('swtchstmt case', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{switch(1){case this.a:1}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{switch(1){case this.a:1}}))})])}}migi.name(A,"A");');
  });
  it('swtchstmt case expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{switch(1){case 1:this.a}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{switch(1){case 1:this.a}}))})])}}migi.name(A,"A");');
  });
  it('swtchstmt default', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map(()=>{switch(1){case 1:1;default:this.a}})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map(()=>{switch(1){case 1:1;default:this.a}}))})])}}migi.name(A,"A");');
  });
  it('bind only in return', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a @bind b render(){return <p>{[].map((item)=>{return this.a+this.b})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[[].map((item)=>{return new migi.Obj(["a","b"],this,function(){return(this.a+this.b)})})])}}migi.name(A,"A");');
  });
  it('bind not only in return', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a @bind b render(){return <p>{[].map((item)=>{this.a;return this.b})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map((item)=>{this.a;return new migi.Obj("b",this,function(){return(this.b)})}))})])}}migi.name(A,"A");');
  });
  it('bind not only in return 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a @bind b render(){return <p>{this.b.map((item)=>{return this.a})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")} set b(v){this.__setBind("b",v);this.__data("b")}get b(){ return this.__getBind("b")}render(){return migi.createVd("p",[],[new migi.Obj("b",this,function(){return(this.b.map((item)=>{return new migi.Obj("a",this,function(){return(this.a)})}))})])}}migi.name(A,"A");');
  });
  it('in arrowfn', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map((item)=>{[].map((item2)=>{this.a});return 1})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map((item)=>{[].map((item2)=>{this.a});return 1}))})])}}migi.name(A,"A");');
  });
  it('in arrowfn 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map((item)=>{return [].map((item2)=>{return this.a})})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[[].map((item)=>{return [].map((item2)=>{return new migi.Obj("a",this,function(){return(this.a)})})})])}}migi.name(A,"A");');
  });
  it('in arrowfn 3', function() {
    var s = 'class A extends migi.xxx{constructor(){}@bind a render(){return <p>{[].map((item)=>{[].map((item2)=>{return this.a})})}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){} set a(v){this.__setBind("a",v);this.__data("a")}get a(){ return this.__getBind("a")}render(){return migi.createVd("p",[],[new migi.Obj("a",this,function(){return([].map((item)=>{[].map((item2)=>{return this.a})}))})])}}migi.name(A,"A");');
  });
});

describe('other', function() {
  it('exception', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){var a=[];var b;return <p></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){var a=[];var b;return migi.createVd("p",[],[])}}migi.name(A,"A");');
  });
});
