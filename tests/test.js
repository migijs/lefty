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
    expect(res).to.eql('migi.createVd("a",{"href":"#"},["link"])');
  });
  it('prop with -', function() {
    var s = '<div data-test="-"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{"data-test":"-"},[])');
  });
  it('multi props', function() {
    var s = '<div class="c" title="title"></div>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("div",{"class":"c","title":"title"},[])');
  });
  it('self close', function() {
    var s = '<img src="xxx"/>';
    var res = lefty.parse(s);
    expect(res).to.eql('migi.createVd("img",{"src":"xxx"})');
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
    expect(res).to.eql('migi.createVd("img",{"src":"test"\n})');
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
  it('no constructor', function() {
    var s = 'class A{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{set t(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('not extends', function() {
    var s = 'class A{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A{constructor(){}set t(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('get/set', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])}}A.__migiName="A";');
  });
  it('no set', function() {
    var s = 'class A extends migi.xxx{constructor(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}A.__migiName="A";');
  });
  it('no get', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(v){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(v){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])}}A.__migiName="A";');
  });
  it('get from others', function() {
    var s = 'class A extends migi.xxx{constructor(){}set v1(v){}set v2(v){}get t(v1,v2){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set v1(v){this.emit(migi.Event.DATA,"v1",arguments.callee.caller);}set v2(v){this.emit(migi.Event.DATA,"v2",arguments.callee.caller);}get t(v1,v2){}render(){return migi.createVd("p",{},[new migi.Obj(["v1","v2"],this,function(){return(this.t)})])}}A.__migiName="A";');
  });
  it('extends from custom', function() {
    var s = 'class A extends X{constructor(){}set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends X{constructor(){}set t(){if(this instanceof migi.Component||migi.browser.lie&&this.__migiCP){this.emit(migi.Event.DATA,"t",arguments.callee.caller)}}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])}}A.__migiName="A";');
  });
});

describe('linkage', function() {
  it('cndtexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{1?this.t:""}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(1?this.t:"")})])}}A.__migiName="A";');
  });
  it('mtplexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t.a)})])}}A.__migiName="A";');
  });
  it('mtplexpr []', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this["t"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this["t"])})])}}A.__migiName="A";');
  });
  it('this[mtplexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this[this.t])})])}}A.__migiName="A";');
  });
  it('this[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this[a,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this[a,this.t])})])}}A.__migiName="A";');
  });
  it('[mtplexpr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a[this.t])})])}}A.__migiName="A";');
  });
  it('[expr]', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a[b,this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a[b,this.t])})])}}A.__migiName="A";');
  });
  it('newexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{new this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(new this.t)})])}}A.__migiName="A";');
  });
  it('postfixexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t--}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t--)})])}}A.__migiName="A";');
  });
  it('arrltr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{[this.t]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return([this.t])})])}}A.__migiName="A";');
  });
  it('callexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{fn(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(fn(this.t))})])}}A.__migiName="A";');
  });
  it('addexpr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t+1)})])}}A.__migiName="A";');
  });
  it('addexpr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{0+this.t+1}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(0+this.t+1)})])}}A.__migiName="A";');
  });
  it('&&expr', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a||this.t)})])}}A.__migiName="A";');
  });
  it('&&expr 2', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{a||b||this.t}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(a||b||this.t)})])}}A.__migiName="A";');
  });
  it('onEvent', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={xxx}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",{"onClick":xxx},[])}}A.__migiName="A";');
  });
  it('cb event', function() {
    var s = 'class A extends migi.xxx{constructor(){}cb(){}render(){return <p onClick={this.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}cb(){}render(){return migi.createVd("p",{"onClick":new migi.Cb(this,this.cb)},[])}}A.__migiName="A";');
  });
  it('explicit', function() {
    var s = 'class Person extends migi.Component{constructor(){}get name(first,last){}set first(v){}set last(v){}render(){return(<p>{this.name}</p>);}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class Person extends migi.Component{constructor(){}get name(first,last){}set first(v){this.emit(migi.Event.DATA,"first",arguments.callee.caller);}set last(v){this.emit(migi.Event.DATA,"last",arguments.callee.caller);}render(){return(migi.createVd("p",{},[new migi.Obj(["first","last"],this,function(){return(this.name)})]));}}Person.__migiName="Person";');
  });
  it('(expr)', function() {
    var s = 'class A extends migi.xxx{constructor(){}set t(){}get t(){}render(){return <p>{(this.t)}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}set t(){this.emit(migi.Event.DATA,"t",arguments.callee.caller);}get t(){}render(){return migi.createVd("p",{},[new migi.Obj("t",this,function(){return((this.t))})])}}A.__migiName="A";');
  });
  it('model .', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model.a}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",{},[new migi.Obj("model.a",this,function(){return(this.model.a)})])}}A.__migiName="A";');
  });
  it('model [', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p>{this.model["a"]}</p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",{},[new migi.Obj("model.a",this,function(){return(this.model["a"])})])}}A.__migiName="A";');
  });
  it('model event', function() {
    var s = 'class A extends migi.xxx{constructor(){}render(){return <p onClick={this.model.cb}></p>}}';
    var res = lefty.parse(s);
    expect(res).to.eql('class A extends migi.xxx{constructor(){}render(){return migi.createVd("p",{"onClick":new migi.Cb(this.model,this.model.cb)},[])}}A.__migiName="A";');
  });
});

describe('lie', function() {
  beforeEach(function() {
    lefty.reset();
  });
  it('no extends', function() {
    var s = 'class A{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('class A{set t(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('no get/set', function() {
    var s = 'class A extends B{constructor(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();var _1={};function A(){if(migi.browser.lie&&this.__hackLie&&(this.__migiCP||this.__migiMD)){return this.__hackLie(A,_1)}}A.prototype.render=function(){return migi.createVd("p",{},[this.t])}if(!migi.browser.lie){Object.defineProperties(A.prototype,_1)}Object.keys(B).forEach(function(k){A[k]=B[k]});A.__migiName="A";');
  });
  it('no render', function() {
    var s = 'class A extends B{constructor(){}set t(){}get t(){}r(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();var _1={};function A(){if(migi.browser.lie&&this.__hackLie&&(this.__migiCP||this.__migiMD)){return this.__hackLie(A,_1)}}_1.t={};_1.t.set =function(){if(this instanceof migi.Component||migi.browser.lie&&this.__migiCP){this.emit(migi.Event.DATA,"t",arguments.callee.caller)}}_1.t.get =function(){}A.prototype.r=function(){return migi.createVd("p",{},[this.t])}if(!migi.browser.lie){Object.defineProperties(A.prototype,_1)}Object.keys(B).forEach(function(k){A[k]=B[k]});A.__migiName="A";');
  });
  it('no constructor', function() {
    var s = 'class A extends B{set t(){}get t(){}render(){return <p>{this.t}</p>}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('class A extends B{set t(){}get t(){}render(){return migi.createVd("p",{},[this.t])}}');
  });
  it('normal', function() {
    var s = 'class A extends B{\n' +
      'constructor(...data){\n' +
      'super();\n' +
      'super(a);\n' +
      'super(a,b);\n' +
      'super(...data);\n' +
      'super(a,...data);\n' +
      '}\n' +
      'set t(){}\n' +
      'get t(){}\n' +
      'render(){\n' +
      'return <p>{this.t}</p>\n' +
      '}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();var _1={};\n' +
      'function A(...data){\n' +
      'B.call(this);\n' +
      'B.call(this,a);\n' +
      'B.apply(this,[a,b]);\n' +
      'B.apply(this,Array.from(data));\n' +
      'B.apply(this,[a].concat(Array.from(data)));\n' +
      'if(migi.browser.lie&&this.__hackLie&&(this.__migiCP||this.__migiMD)){return this.__hackLie(A,_1)}}\n' +
      '_1.t={};_1.t.set =function(){if(this instanceof migi.Component||migi.browser.lie&&this.__migiCP){this.emit(migi.Event.DATA,"t",arguments.callee.caller)}}\n' +
      '_1.t.get =function(){}\n' +
      'A.prototype.render=function(){\n' +
      'return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])\n' +
      '}if(!migi.browser.lie){Object.defineProperties(A.prototype,_1)}Object.keys(B).forEach(function(k){A[k]=B[k]});A.__migiName="A";');
  });
  it('super method', function() {
    var s = 'class A extends B{\n' +
      'constructor(...data){\n' +
      'super(...data)\n' +
      '}\n' +
      'set t(){}\n' +
      'get t(){}\n' +
      'render(){\n' +
      'super.a;\n' +
      'super.a();\n' +
      'super.a(a);\n' +
      'super.a(a,b);\n' +
      'super.a(...a);\n' +
      'super.a(a,...b);\n' +
      'return <p>{this.t}</p>\n' +
      '}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();var _1={};\n' +
      'function A(...data){\n' +
      'B.apply(this,Array.from(data))\n' +
      'if(migi.browser.lie&&this.__hackLie&&(this.__migiCP||this.__migiMD)){return this.__hackLie(A,_1)}}\n' +
      '_1.t={};_1.t.set =function(){if(this instanceof migi.Component||migi.browser.lie&&this.__migiCP){this.emit(migi.Event.DATA,"t",arguments.callee.caller)}}\n' +
      '_1.t.get =function(){}\n' +
      'A.prototype.render=function(){\n' +
      'B.prototype.a;\n' +
      'B.prototype.a.call(this);\n' +
      'B.prototype.a.call(this,a);\n' +
      'B.prototype.a.apply(this,[a,b]);\n' +
      'B.prototype.a.apply(this,Array.from(a));\n' +
      'B.prototype.a.apply(this,[a].concat(Array.from(b)));\n' +
      'return migi.createVd("p",{},[new migi.Obj("t",this,function(){return(this.t)})])\n' +
      '}if(!migi.browser.lie){Object.defineProperties(A.prototype,_1)}Object.keys(B).forEach(function(k){A[k]=B[k]});A.__migiName="A";');
  });
  it('static', function() {
    var s = 'class A extends B{constructor(){}static get t(){}static set t(v){}}';
    var res = lefty.parse(s, true);
    expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();var _1={};function A(){if(migi.browser.lie&&this.__hackLie&&(this.__migiCP||this.__migiMD)){return this.__hackLie(A,_1)}}var _3={};_3.t={};_3.t.get =function(){}_3.t.set =function(v){if(this instanceof migi.Component||migi.browser.lie&&this.__migiCP){this.emit(migi.Event.DATA,"t",arguments.callee.caller)}}if(!migi.browser.lie){Object.defineProperties(A.prototype,_1);Object.defineProperties(A,_3)}Object.keys(B).forEach(function(k){A[k]=B[k]});A.__migiName="A";');
  });
});