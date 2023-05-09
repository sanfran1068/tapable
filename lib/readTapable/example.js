const { SyncHook } = require('tapable')

const hooks = new SyncHook(['arg1','arg2'])

hooks.tap('flag1', () => {
    console.log(1)
})

hooks.tap('flag',() => {
    console.log(2)
})

hooks.call('arg1', 'arg2');

/** 编译后的结果
function fn(arg1, arg2) {
	"use strict";
	var _context;
	var _x = this._x;
	var _fn0 = _x[0];
	_fn0(arg1, arg2);
	var _fn1 = _x[1];
	_fn1(arg1, arg2);
}
 */


// --------------------------------------------

// 再次添加一个tap事件函数
hooks.tap('flag3', () => {
  console.log(3);
});

// 同时再次调用
hooks.call('arg1', 'arg2');
