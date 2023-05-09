class HookCodeFactory {
  constructor(config) {
    this.config = config;
    this.options = undefined;
    this._args = undefined;
  }

  /**
	 * @param {*} instance 即 new SyncHook() 的实例
	 * @param {*} options _createCall 中整合的 options，包括 taps、interceptors、args、type
	 */
	setup(instance, options) {
		instance._x = options.taps.map(i => i.fn)
	}

  /**
	 * @param {*} options _createCall 中整合的 options，包括 taps、interceptors、args、type
	 */
  create(options) {
		this.init(options);
    let fn;
    switch (this.options.type) {
      case 'sync':
        fn = new Function(
          this.args(),
          '"use strict";\n' +
					this.header() +
					this.contentWithInterceptors({
						onError: (err) => `throw ${err};\n`,
						onResult: (result) => `return ${result};\n`,
						resultReturns: true,
						onDone: () => '',
						rethrowIfPossible: true,
					})
        );
        break;
      default:
        break;
    }
    this.deinit();
    return fn;
	}

	/**
	 * 该方法是将参数用 , 连接作为参数传入函数中
	 * @param { before, after } 指的是 options 里传入 object 类型 options 里面的属性
	 * @returns
	 */
	args({ before, after } = {}) {
    let allArgs = this._args;
    if (before) allArgs = [before].concat(allArgs);
    if (after) allArgs = allArgs.concat(after);
    if (allArgs.length === 0) {
      return '';
    } else {
      return allArgs.join(', ');
    }
  }

	header() {
    let code = '';
    // this.needContext()是false context api 已经快要被废弃掉了
    // if (this.needContext()) {
    //   code += 'var _context = {};\n';
    // } else {
    //   code += 'var _context;\n';
    // }
    code += 'var _x = this._x;\n';
    // if (this.options.interceptors.length > 0) {
    //   code += 'var _taps = this.taps;\n';
    //   code += 'var _interceptors = this.interceptors;\n';
    // }
    return code;
	}

	contentWithInterceptors(options) {
		// 如果存在拦截器
		if (this.options.interceptors.length > 0) {
			// ...
		} else {
			return this.content(options);
		}
	}

	content({ onError, onDone, rethrowIfPossible }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onDone,
      rethrowIfPossible,
    });
	}

	// 根据 this._x 生成整体函数内容
  callTapsSeries({ onDone }) {
    let code = '';
    let current = onDone;
    // 没有注册的事件则直接返回
    if (this.options.taps.length === 0) return onDone();
    // 遍历 taps 注册的函数 编译生成需要执行的函数
    for (let i = this.options.taps.length - 1; i >= 0; i--) {
      const done = current;
      // 一个一个创建对应的函数调用
      const content = this.callTap(i, {
        onDone: done,
      });
      current = () => content;
    }
    code += current();
    return code;
	}

	// 编译生成单个的事件函数并且调用 比如 fn1 = this._x[0]; fn1(...args)
  callTap(tapIndex, { onDone }) {
    let code = '';
    // 无论什么类型的都要通过下标先获得内容
    // 比如这一步生成 var _fn[1] = this._x[1]
    code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
    // 不同类型的调用方式不同
    // 生成调用代码 fn1(arg1,arg2,...)
    const tap = this.options.taps[tapIndex];
    switch (tap.type) {
      case 'sync':
        code += `_fn${tapIndex}(${this.args()});\n`;
        break;
      // 其他类型不考虑
      default:
        break;
    }
    if (onDone) {
      code += onDone();
    }
    return code;
  }

	init(options) {
    this.options = options;
    // new SyncHook() 传入的 args 数组
    this._args = options.args.slice();
	}

	/**
	 * 在编译完成一个 call 方法之后会将解除绑定传入的参数
	 */
	deinit() {
    this.options = undefined;
    this._args = undefined;
  }
}

module.exports = HookCodeFactory;
