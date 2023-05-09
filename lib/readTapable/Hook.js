class Hook {
  constructor(args = [], name = undefined) {
    // 初始化 Hook 时传递的参数
    this._args = args;
    // name 参数，标识符，可以忽略
    this.name = name;
    // 保存通过 tap 注册的内容，事件和对应的函数
    this.taps = [];
    // 保存拦截器相关内容 暂时先忽略拦截器
    this.interceptors = [];
		// 为什么要多一个 _call 方法呢? 其实这个是用来打补丁的方法
		this._call = CALL_DELEGATE;
		// hook.call 调用方法
    this.call = CALL_DELEGATE;
    // _x 存放 hook 中所有通过 tap 注册的函数
    this._x = undefined;

    // 最终的动态编译方法
    this.compile = this.compile;
    // 相关注册方法
		this.tap = this.tap;

    // 与SyncHook无关的代码
    // this._callAsync = CALL_ASYNC_DELEGATE;
    // this.callAsync = CALL_ASYNC_DELEGATE;
    // this._promise = PROMISE_DELEGATE;
    // this.promise = PROMISE_DELEGATE;
    // this.tapAsync = this.tapAsync;
    // this.tapPromise = this.tapPromise;
	}

	tap(options, fn) {
		// 这里额外多做了一层封装，因为 this._tap 是一个通用方法
		// 这里我们使用的是同步，所以第一参数表示类型传入 sync
		// 如果是异步同理为 async、Promise 同理为 promise 这样就很好的区分了三种注册方式
		this._tap('sync', options, fn);
	}

	/**
   * @param {*} type 注册的类型 promise、async、sync
   * @param {*} options 注册 tap 函数时传递的第一个参数对象
   * @param {*} fn 注册 tap 函数时传入监听的事件函数
   */
  _tap(type, options, fn) {
    if (typeof options === 'string') {
      options = {
        name: options.trim(),
      };
    } else if (typeof options !== 'object' || options === null) {
      // 如果非对象或者传入 null
      throw new Error('Invalid tap options');
    }
    if (typeof options.name !== 'string' || options.name === '') {
      // 如果传入的 options.name 不是字符串或者是空串
      throw new Error('Missing name for tap');
		}
		// 那么此时剩下的 options 类型仅仅就只有 object 类型了
    // 合并参数 { type, fn,  name:'xxx'  }
    options = Object.assign({ type, fn }, options);
    // 将合并后的参数插入
    this._insert(options)
	}

	_insert(item) {
		this._resetCompilation(); // 这是一个很重要的补丁方法
    this.taps.push(item)
	}

	_resetCompilation() {
		this.call = this._call;
	}

	/**
	 * 编译最终生成的执行函数的方法
	 * compile 是一个抽象方法 需要在继承Hook类的子类方法中进行实现
   * @param {*} type 注册的类型 promise、async、sync
   */
	_createCall(type) {
		return this.compile({
			taps: this.taps,
			interceptors: this.interceptors, // 拦截器
			args: this._args,
			type,
		});
	}

	/**
	 * 可以看到 hook.call() 执行时的调用链是：call => CALL_DELEGATE => _createCall => compile
	 * 而且只有在执行 call 方法时，才会执行编译，是一种懒编译
   * @param {*} optinos _createCall 中整合的 options
   */
  compile(options) {
    throw new Error('Abstract: should be overridden');
  }
}

const CALL_DELEGATE = function (...args) {
	this.call = this._createCall("sync");
	return this.call(...args);
};

module.exports = Hook;
