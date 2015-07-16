var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var lefty = require('../');

describe('api', function() {
  it('#parse', function() {
    expect(lefty.parse).to.be.a(Function);
  });
  it('#tokens', function() {
    lefty.parse('');
    expect(lefty.tokens).to.be.a(Array);
  });
  it('#ast', function() {
    expect(lefty.ast).to.be.a(Object);
  });
});

describe('simple', function() {
  it('html tag lower', function() {
    var s = '<div>test</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},["test"])');
  });
  it('Component tag upper', function() {
    var s = '<Cmpt>test</Cmpt>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createCp(Cmpt,{},["test"])');
  });
  it('no children', function() {
    var s = '<div></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[])');
  });
  it('child is a var', function() {
    var s = '<div>{test}</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[test])');
  });
  it('multi children', function() {
    var s = '<div>t1{test}t2</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},["t1",test,"t2"])');
  });
  it('multi var children', function() {
    var s = '<div>{t1}{test}t2</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[t1,test,"t2"])');
  });
  it('nest html', function() {
    var s = '<div>text<p><span>xxx</span></p></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},["text",migi.createVd("p",{},[migi.createVd("span",{},["xxx"])])])');
  });
  it('props', function() {
    var s = '<a href="#">link</a>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("a",{href:"#"},["link"])');
  });
  it('prop with -', function() {
    var s = '<div data-test="-"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{\'data-test\':"-"},[])');
  });
  it('multi props', function() {
    var s = '<div class="c" title="title"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{class:"c",title:"title"},[])');
  });
  it('self close', function() {
    var s = '<img src="xxx"/>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("img",{src:"xxx"})');
  });
  it('close error', function() {
    var s = '<img src="xxx">';
    expect(function() {
      lefty.parse(s);
    }).to.throwError();
  });
  it('parse use es6', function() {
    var s = 'const a = <div/>';
    var res = lefty.parse(s, false, true);
    expect(res).to.eql('var a = migi.createVd("div",{})');
  });
  it('tag blank', function() {
    var s = '<div> {ttt }</div >';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[ ttt ]) ');
  });
  it('virtual', function() {
    var s = '<div />;';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{});');
  });
  it('quote', function() {
    var s = '<img src={"test"\n}/>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("img",{src:"test"\n})');
  });
  it('blank', function() {
    var s = '<div> </div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[" "])');
  });
  it('line', function() {
    var s = '<div>\n</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},["\\\n"])');
  });
  it('blank between tag', function() {
    var s = '<div> <span/>\n</div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{},[ migi.createVd("span",{})\n])');
  });
  it.skip('spread', function() {
    var s = '<div attrs={...a} />';
    var res = lefty.parse(s);
  });
});

describe('classes', function() {
  it('class', function() {
    var s = 'class A{render(){return <div/>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{render(){return migi.createVd("div",{})}}');
  });
  it('not extend from migi.', function() {
    var s = 'class A{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{set t(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('get/set', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])}}');
  });
  it('no set', function() {
    var s = 'class A extends migi.xxx{get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('no get', function() {
    var s = 'class A extends migi.xxx{set t(v){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(v){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])}}');
  });
  it('get from others', function() {
    var s = 'class A extends migi.xxx{set v1(v){}set v2(v){}get t(v1,v2){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set v1(v){this.emit(migi.Event.DATA,"v1",arguments.callee.caller);}set v2(v){this.emit(migi.Event.DATA,"v2",arguments.callee.caller);}get t(v1,v2){}render(){return migi.createVd("p",{},[new migi.Obj(["v1","v2"],this,function(){return(this.t)})])}}');
  });
});

describe('linkage', function() {
  it('cndtexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{1?this.t:""}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(1?this.t:"")})])}}');
  });
  it('mtplexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this.t.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t.a)})])}}');
  });
  it('mtplexpr []', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this["t"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this["t"])})])}}');
  });
  it('this[mtplexpr]', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this[this.t])})])}}');
  });
  it('this[expr]', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this[a,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this[a,this.t])})])}}');
  });
  it('[mtplexpr]', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{a[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a[this.t])})])}}');
  });
  it('[expr]', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{a[b,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a[b,this.t])})])}}');
  });
  it('newexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{new this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(new this.t)})])}}');
  });
  it('postfixexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this.t--}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t--)})])}}');
  });
  it('arrltr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return([this.t])})])}}');
  });
  it('callexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{fn(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(fn(this.t))})])}}');
  });
  it('addexpr', function() {
    var s = 'class A extends migi.xxx{set t(){}get t(){}render(){return <p>{this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t+1)})])}}');
  });
  it('onEvent', function() {
    var s = 'class A extends migi.xxx{render(){return <p onClick={xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{render(){return migi.createVd("p",{onClick:xxx},[])}}');
  });
  it('cb event', function() {
    var s = 'class A extends migi.xxx{cb(){}render(){return <p onClick={this.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{cb(){}render(){return migi.createVd("p",{onClick:new migi.Cb(this,this.cb)},[])}}');
  });
  it('explicit', function() {
    var s = 'class Person extends migi.Component{get name(first,last){}set first(v){}set last(v){}render(){return(<p>{this.name}</p>);}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class Person extends migi.Component{get name(first,last){}set first(v){this.emit(migi.Event.DATA,"first",arguments.callee.caller);}set last(v){this.emit(migi.Event.DATA,"last",arguments.callee.caller);}render(){return(migi.createVd("p",{},[new migi.Obj(["first","last"],this,function(){return(this.name)})]));}}');
  });
});