# A JSX transformer for migi

`lefty`取自动漫寄生兽主角小右在英文版翻译的镜像名，意指将jsx语言翻译为等价的es6。

[![NPM version](https://badge.fury.io/js/lefty.png)](https://npmjs.org/package/lefty)
[![Build Status](https://travis-ci.org/migijs/lefty.svg?branch=master)](https://travis-ci.org/migijs/lefty)
[![Coverage Status](https://coveralls.io/repos/migijs/lefty/badge.png)](https://coveralls.io/r/migijs/lefty)
[![Dependency Status](https://david-dm.org/migijs/lefty.png)](https://david-dm.org/migijs/lefty)

## INSTALL
```
npm install lefty
```

[![logo](https://raw.githubusercontent.com/migijs/lefty/master/logo.jpg)](https://github.com/migijs/lefty)

## 文档
https://github.com/migijs/lefty/wiki/%E6%96%87%E6%A1%A3

## API
* parse(code:String):String 传入要解析的jsx代码，返回翻译好的js代码
* tokens():Array\<Token> 返回jsx的token列表
* ast():Object 返回jsx的语法树

## Demo
* demo目录下是一个web端的实时转换例子，本地浏览需要npm install安装依赖
* 依赖的语法解析器来自于homunculus：https://github.com/army8735/homunculus
* 在线地址：http://army8735.me/migijs/lefty/demo/

# License
[MIT License]
