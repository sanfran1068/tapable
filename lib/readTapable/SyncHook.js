const Hook = require("./Hook");
const HookCodeFactory = require('./HookCodeFactory');

class SyncHookCodeFactory extends HookCodeFactory {
  content({ onError, onDone, rethrowIfPossible }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onDone,
      rethrowIfPossible,
    });
  }
}

/**
 * 调用栈 this.call() -> CALL_DELEGATE() -> this._createCall() -> this.compile() -> COMPILE()
 * @param {*} options
 * @returns
 */
function COMPILE(options) {
  factory.setup(this, options);
  return factory.create(options);
}

const factory = new SyncHookCodeFactory();

const TAP_ASYNC = () => {
	throw new Error("tapAsync is not supported on a SyncHook");
};

const TAP_PROMISE = () => {
	throw new Error("tapPromise is not supported on a SyncHook");
};

function SyncHook(args = [], name = undefined) {
	// 通过 new Hook(args, name) 创建了基础的 hook 实例对象
	const hook = new Hook(args, name);
	// 自身的构造函数
	hook.constructor = SyncHook;
	// 同步类型的 hook 不存在 tapAsync 和 tapPromise 方法
	hook.tapAsync = TAP_ASYNC;
	hook.tapPromise = TAP_PROMISE;
  // 在调用 hook.call 方法时真正用来编译函数的方法
	hook.compile = COMPILE;
	return hook;
}

SyncHook.prototype = null;

module.exports = SyncHook;
