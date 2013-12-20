

/**
 * @name suns.js
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview Object extending utilities for node and browser (amd support)
 */

(function (global) {
    

    // no-op function
    var none = function none() {};


    var arrayForEach = Array.prototype.forEach;
    var breaker = {};

    /**
     * call iterator for each property of obj
     * @function
     * @private
     * @param {Object} obj
     * @param {Function} iterator
     * @param {Object} context
     */
    var each = function each(obj, iterator, context) {

        if (obj === undefined || obj === null) { return; }
        if (arrayForEach && obj.forEach === arrayForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    };

    /**
     * copy object's properties
     * @function
     * @private
     * @param {Object} obj
     */
    var copyProps = function CopyProps(obj) {
        each(Array.prototype.slice.call(arguments, 1), function (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };

    var superProp_reg = /__(super)+__/;

    /**
     * extend from parent with a childProto object.
     * @param {String} [name]
     * @param {Function} parent
     * @param {Object} childProto
     */
    var _extendOne = function _extendOne(name, parent, childProto) {

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.

        var child;

        if (typeof childProto !== 'object') {
            throw new Error('typeof childCtorOrProto invalid. it should be Object (prototype object).');
        }

        if (childProto && Object.prototype.hasOwnProperty.call(childProto, 'constructor')) {
            child = childProto.constructor;
        } else {
            child = new Function('parent', 'return function ' + name + '(){ parent.apply(this, arguments); };')(parent);
        }

        // Add static properties
        copyProps(child, parent);

        var Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        if (childProto) {
            copyProps(child.prototype, childProto);
        }

        for (var prop in parent) {
            if (superProp_reg.test(prop)) {
                var superProp = prop.replace('super', 'supersuper');
                child[superProp] = parent[prop];
            }
        }
        child.__super__ = parent.prototype;
        child.__superCtor__ = parent;

        return child;
    };

    /**
     * extend multiple children
     * @param {String} name
     * @param {Function} parent
     * @param {Array<Object>} children
     */
    var _extend = function _extend(name, parent, children) {

        if (children.length < 1) {
            // end of recursion
            return parent;
        }

        // get first childProto
        var childProto = children.shift();
        var child = _extendOne(name, parent, childProto);

        // extend recursively
        return _extend(name, child, children);
    };

    /**
     * define prototype chain properly and
     * create new object that extends parent object.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Function} parent function as a parent
     * @param {Object} childProto prototype object as a child
     * @param {Object} [childProto] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var Parent = function Parent() {};
     * var Child = extend(
     *     'Child',
     *     Parent,
     *     {
     *         initialize: function initialize()
     *     }
     * );
     */
    var extend = function extend(/** name, */ parent, childProto /** childProto... */) {

        var name = '';
        var args = Array.prototype.slice.apply(arguments);
        if (typeof args[0] === 'string') {
            name = args.shift();
            //'.'が含まれているとメソッド名としてダメなので
            //'_'に置換
            name = name.replace(/\./g, '_');
        }
        parent = args.shift();

        return _extend(name, parent, args);
    };

    /**
     * `Object.extend = suns.extendThis`
     * makes Object extendable.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Object} childProto prototype object as a child
     * @param {Object} [childProto] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var FooClass = function FooClass() {
     * };
     * FooClass.prototype = {
     *     func1: function func1() {}
     * };
     * FooClass.extend = suns.extendThis;
     *
     * // OK
     * var Child = FooClass.extend({
     *     childFunc: function childFunc() {}
     * });
     * // same as
     * Child = suns.extend(FooClass, {
     *     childFunc: function childFunc() {}
     * });
     */
    var extendThis = function extendThis(/** name, */ childProto /**, childProto */) {
        var parent = this;

        var args = Array.prototype.slice.apply(arguments);
        var newArgs = [];
        if (typeof args[0] === 'string') {
            newArgs.push(args.shift()); // name
        }
        newArgs.push(parent);
        newArgs = newArgs.concat(args);
        return extend.apply(this, newArgs);
    };

    /**
     * mixin from parent with a child's prototype object or constructor
     * @param {String} [name]
     * @param {Function} parent
     * @param {Object} childProto
     */
    var _mixOne = function _mixOne(name, parent, childCtorOrProto) {

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.

        var child, childProto;

        var typeOfChild = typeof childCtorOrProto;
        if (typeOfChild === 'function') {
            childProto = childCtorOrProto.prototype;
        } else if (typeOfChild === 'object') {
            childProto = childCtorOrProto;
        } else {
            throw new Error('typeof childCtorOrProto invalid. it should be Function or Object.');
        }

        if (typeOfChild === 'function') {
            // if child is constructor function,
            // wrap child constructor to call
            // both parent's constructor and child constructor.
            child = new Function('parent, childCtor', 'return function ' + name + '(){ parent.apply(this, arguments); childCtor.apply(this, arguments)};')(parent, childCtorOrProto);
        } else if (childProto && Object.prototype.hasOwnProperty.call(childProto, 'constructor')) {
            child = childProto.constructor;
        } else {
            child = new Function('parent', 'return function ' + name + '(){ parent.apply(this, arguments); };')(parent);
        }

        // Add static properties
        copyProps(child, parent);

        var Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        if (childProto) {
            copyProps(child.prototype, childProto);
        }

        for (var prop in parent) {
            if (superProp_reg.test(prop)) {
                var superProp = prop.replace('super', 'supersuper');
                child[superProp] = parent[prop];
            }
        }
        child.__super__ = parent.prototype;
        child.__superCtor__ = parent;

        return child;
    };


    /**
     * mix multiple children.
     * @param {String} name
     * @param {Function} parent
     * @param {Array<Object>} children
     */
    var _mixin = function _mixin(name, parent, children) {

        if (children.length < 1) {
            // end of recursion
            return parent;
        }

        // get first childProto
        var childProto = children.shift();
        var child = _mixOne(name, parent, childProto);

        // extend recursively
        return _mixin(name, child, children);
    };


    /**
     * define prototype chain properly and
     * create new object that extends parent object.
     * if constructor function specified as a child,
     * parent's constructor is called automatically
     * before child's constructor called.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Function} parent function as a parent
     * @param {Object|Function} child prototype object or constructor as a child
     * @param {Object|Function} [child] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var Parent = function Parent() {};
     * var Child = extend(
     *     'Child',
     *     Parent,
     *     {
     *         constructor: function Child() {
     *             Child.__super__.constructor.apply(this, arguments);
     *         }
     *     }
     * );
     */
    var mixin = function mixin(/** name, */ parent, child /** child... */) {

        var name = '';
        var args = Array.prototype.slice.apply(arguments);
        if (typeof args[0] === 'string') {
            name = args.shift();
            //'.'が含まれているとメソッド名としてダメなので
            //'_'に置換
            name = name.replace(/\./g, '_');
        }
        parent = args.shift();

        return _mixin(name, parent, args);
    };

    /**
     * suns object
     * @namespace suns
     */
    var suns = {
        /**
         * @borrows extend as extend
         */
        extend: extend,

        /**
         * @borrows extendThis as extendThis
         */
        extendThis: extendThis,

        /**
         * @borrows mixin as mixin
         */
        mixin: mixin,

        /**
         * version
         * @static
         */
        VERSION: '0.4.6'
    };

    if (typeof define === 'function' && define.amd) {
        // requirejs
        define('beez-core/suns',['require','exports','module'],function (require, exports, module) {
            return suns;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = suns;
    } else {
        // others, export global
        global.suns = suns;
    }

})(this);

/**
 * @name error.js<beez-core>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp">
 * @overview It is an error class for beez.
 */

(function (global) {

    define('beez-core/error',['require','exports','module','beez-core/suns'],function __BeezError__(require, exports, module) {
        

        var suns = require('beez-core/suns');

        /**
         * Beez Error Class
         * @class
         * @name BeezError
         * @extends {suns}
         */
        var BeezError = suns.extend(
            'beez.Error',
            Error,
            {
                /**
                 *
                 * @memberof BeezError
                 * @param {String} message error message
                 */
                constructor: function BeezError(message) {
                    Error.apply(this, arguments);
                    Error.captureStackTrace(this, this.constructor);
                    this.message = message;
                }
            }
        );
        BeezError.extend = suns.extendThis;

        return BeezError;
    });

})(this);

/**
 * @name bucks.js
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview Async chain utility for node and the browser. (amd support)
 */

(function (global) {
    

    // no-op function
    var none = function none() {};


    /**
     * 配列かどうかを返します
     * @function
     * @private
     * @param {*} obj
     * @return {boolean}
     */
    var isArray = Array.isArray || function isArray(obj) {
        return obj.toString() === '[object Array]';
    };

    /**
     * 配列が空であればtrueを返します
     * @function
     * @private
     * @param {Array} arr
     * @return {boolean}
     */
    var isArrayEmpty = function isArrayEmpty(arr) {
        return (arr.length === 0);
    };

    var logError = function logError(e) {
        if (e.stack) {
            console.error(e.stack);
        } else if (e.message) {
            console.error(e.message);
        } else {
            console.error(e);
        }
    };


    var _uid = 0;
    var uid = function uid() {
        return '__bucks__' + _uid++;
    };

    /**
     * Bucks chain constructor.
     * @name Bucks
     * @constructor
     */
    var Bucks = function Bucks(params) {
        this._tasks = [];
        this._taskcount = 0;
        this._results = [];
        this.callback = none;
        this.failure  = none;
        this._alive = true;
        this.__id = uid();
        Bucks.living[this.__id] = this;
        this.initialize(params);
    };

    /**
     * bucks.js version
     * @memberof Bucks
     * @static
     */
    Bucks.VERSION = '0.8.2';

    /**
     * if set `true`, uncaught errors are logged
     * @memberof Bucks
     * @static
     */
    Bucks.DEBUG = false;

    /**
     * 実行中bucksオブジェクト群
     * @memberof Bucks
     * @static
     */
    Bucks.running = {};

    /**
     * 存在するがまだ`end`がコールされていないbucksオブジェクト群
     * @memberof Bucks
     * @static
     */
    Bucks.living = {};

    /**
     * onErrorが設定されているか
     * @memberof Bucks
     * @static
     */
    Bucks._isOnError = false;

    /**
     * すべての例外をcatchする関数
     * @memberof Bucks
     * @static
     */
    Bucks.onError = function onError(onError) {
        var self = this;
        (function (isOnError) {
            Bucks._onError = onError;
            Bucks._isOnError = isOnError;
        })(true);
    };

    // prototype implementation
    Bucks.prototype = {

        /**
         * Override Me to initialize
         * @method
         * @instance
         * @memberof Bucks
         */
        initialize: none,

        /**
         * taskの引数をラップして共通化します。
         * @memberof Bucks
         * @instance
         * @private
         * @param {Function} task ex) task(err, res, next) | task(err, res) | task(err) | task()
         * @throws {Error} args length invalid
         * @return {function task(err, res, next)}
         */
        _normalizeTask: function _normalizeTask(task) {
            var _task = task;
            if (task.length < 3) {
                _task = function _task(err, res, next) {
                    // wrap task with no callback
                    var result = task.call(null, err, res);
                    next.call(null, null, result);
                };
            } else if (task.length === 3) {

                // normal
                _task = task;

            } else if (task.length === 4) {

                // with index
                _task = function _task(err, res, next, index) {
                    task.call(null, err, res, next, index);
                };

            } else {
                throw new Error('args length invalid');
            }
            return _task;
        },


        /**
         * thenのコールバックをラップして引数を共通化します
         * @memberof Bucks
         * @instance
         * @private
         * @param {Function} onSuccess ex) onSuccess(res, next) | onSuccess(res) | onSuccess()
         * @throws {Error} args length invalid
         * @return {function onSuccess(res, next)} wrappedTask
         */
        _normalizeSuccess: function _normalizeSuccess(onSuccess) {
            var _onSuccess = onSuccess;
            if (onSuccess.length < 2) {
                _onSuccess = function (res, next) {
                    var result = onSuccess(res);
                    next(null, result);
                };
            } else if (onSuccess.length === 2) {
                _onSuccess = onSuccess;
            } else {
                throw new Error('args length invalid');
            }
            return _onSuccess;
        },


        /**
         * errorのコールバックをラップして引数を共通化します
         * @memberof Bucks
         * @instance
         * @private
         * @param {Function} onError ex) onError(err, next)
         * @throws {Error} args length invalid
         * @return {function onError(err, next)} wrappedTask
         */
        _normalizeError: function _normalizeError(onError) {
            var _onError = onError;
            if (onError.length < 2 || 3 < onError.length) {
                throw new Error(onError.name + ': args length invalid. should be: onError(err, next)');
            }
            return _onError;
        },


        /**
         * タスクを追加します。
         * @memberof Bucks
         * @instance
         * @param {Function} task taskの形式は `task(err, res, next)`,
         * taskのcallbackであるnextの形式は `next(err, res)`
         * @throws {Error} args length invalid
         * @return {Bucks}
         */
        add: function add(task) {
            if (!this._alive) {
                throw new Error('this bucks object already destroyed.');
            }
            var _task = this._normalizeTask(task);
            this._tasks.push(_task);
            return this;
        },


        /**
         * 前のタスクがエラーなく成功した場合のみ呼ばれるタスクを追加します
         * @memberof Bucks
         * @instance
         * @param {Function} onSuccess `onSuccess(res, next)`. `next(err, res)`
         * @throws {Error} args length invalid
         * @return {Bucks}
         */
        then: function then(onSuccess) {
            var _onSuccess = this._normalizeSuccess(onSuccess);
            return this.add(function onSuccessTask(err, res, next) {
                if (err) {
                    // pass this error to next task
                    next(err);
                } else {
                    // call onSuccess
                    _onSuccess(res, next);
                }
            });
        },

        /**
         * 空のタスクを追加します。
         * @memberof Bucks
         * @instance
         * @return Bucks
         */
        empty: function empty() {
            return this.then(function emptyTask() {});
        },

        /**
         * 前のタスクがエラーだった場合のみ呼ばれるタスクを追加します
         * @memberof Bucks
         * @instance
         * @param {Function} onError `onError(err, next)`. `next(err, res)`
         * @throws {Error} args length invalid
         * @return {Bucks}
         */
        error: function error(onError) {
            var _onError = this._normalizeError(onError);
            return this.add(function onErrorTask(err, res, next) {
                if (err) {
                    // call onError
                    _onError(err, next);
                } else {
                    // pass this result to next
                    next(err, res);
                }
            });
        },


        /**
         * 次のタスクを実行します
         * @memberof Bucks
         * @instance
         * @private
         * @param {Object} err previous error
         * @param {*} res previous result
         * @return {Bucks}
         */
        _iterator: function _iterator(err, res) {

            if (!this._alive) {
                throw new Error('this bucks object already destroyed.');
            }

            //taskから渡ってきたresを配列に保持して最後に返す
            res ? this._results.push(res) : this._results.push(null);

            var task  = this._tasks.shift();

            if (!task) { // end of task
                return this.destroy(err);
            }

            try {
                var self = this;
                // handle task
                task(err, res, function (err, res) {
                    self._iterator(err, res);
                    return this;
                }, this._taskcount++);

            } catch (exception) {

                if (!this._results) {
                    // this instance already destroyed.
                    // this exception is uncaught exception.
                    if (Bucks.DEBUG) {
                        // if DEBUG, logging
                        logError(exception);
                    }
                    if (Bucks._isOnError) {
                        Bucks._onError(exception, this);
                    } else {
                        throw exception;
                    }
                }

                // handle error
                this._iterator(exception, null);
            }
            return this;
        },


        /**
         * @TODO implement
         */
        debug: function debug() {
            return this;
        },


        /**
         * 複数タスクを並行して実行します。各タスクの結果が　{res:[], err:[]}
         * として次に渡ります。res, errはそれぞれタスクと同じサイズの配列で
         * 結果が無い部分はnullになります。
         * @memberof Bucks
         * @instance
         * @param {Array} tasks タスクの配列です。タスクの形式は addと同様です
         * @return {Bucks}
         */
        parallel: function parallel(tasks) {


            if (!isArray(tasks)) {
                throw new Error('tasks is not array.');
            }

            if (isArrayEmpty(tasks)) {
                return this.add(function passEmpty(err, res, next) {
                    next(null, new ParallelHandler(0).resultObj);
                });
            }

            // normalize each task
            for (var i = 0, l = tasks.length; i < l; i++) {
                var t = tasks[i];
                tasks[i] = this._normalizeTask(t);
            }

            return this.add(function callParallel(err, res, next) {

                var parallelHandler = new ParallelHandler(tasks.length);
                parallelHandler.onFinish(function onFinishParallel(resultObj) {

                    // pass a latest error, if exists
                    var e;
                    for (var i = 0, l = resultObj.err.length; i < l; i++) {
                        var anError = resultObj.err[i];
                        if (anError !== undefined && anError !== null) {
                            e = anError;
                        }
                    }
                    next(e, resultObj);
                });

                tasks.forEach(function callEachTask(t, idx) {

                    setTimeout(function callTaskAsync() { // call async
                        new Bucks().add(t).end(function (e, r) {
                            if (e) {
                                parallelHandler.successOne(idx, e, null);
                            } else {
                                parallelHandler.successOne(idx, null, r[0]);
                            }
                        });
                    }, 0);
                });
            });
        },


        /**
         * 複数タスクを配列でaddするメソッドです。
         * @memberof Bucks
         * @instance
         * @param {Array} tasks タスクの配列です。タスクの形式は addと同様です
         * @return {Bucks}
         * @example
         * var t1 = function t1(err, res, next) {
         *     return 't1';
         * };
         * var t2 = funciton t2(err, res, next) {
         *     return 't2';
         * };
         * new Bucks.waterfall([t1, t2]).end(function finish(err, ress) {
         *     // ress => ['t1', 't2']
         * });
         *
         * // same as
         * new Bucks.add(t1).add(t2).end(function finish(err, ress) {
         *     // ress => ['t1', 't2']
         * });
         */
        waterfall: function waterfall(tasks) {

            if (!isArray(tasks)) {
                throw new Error('tasks is not array.');
            }

            if (isArrayEmpty(tasks)) {
                return this.add(function passEmpty(err, res, next) {
                    next(null, []);
                });
            }

            // normalize and add each task
            for (var i = 0, l = tasks.length; i < l; i++) {
                tasks[i] = this._normalizeTask(tasks[i]);

                this.add(tasks[i]);
            }

            return this;
        },


        /**
         * msミリ秒だけ次の処理を遅延させます
         * @memberof Bucks
         * @instance
         * @param {int} ms 遅延させる時間[ms] default) 0
         * @return {Bucks}
         */
        delay: function delay(ms) {
            return this.add(function (err, res, next) {
                setTimeout(function () {
                    next(err, res);
                }, ms || 0);
            });
        },


        /**
         * OVERRIDE ME.
         * チェイン破棄時に行いたい処理があれば
         * オーバーライドしてください
         * @method
         * @memberof Bucks
         * @instance
         */
        dispose: none,


        /**
         * このオブジェクトを破棄して
         * 最終コールバックをコールします
         * @memberof Bucks
         * @instance
         * @private
         * @param {Error} [err] エラーがあれば渡す
         * @return {Bucks}
         */
        destroy: function destroy(err) {
            if (!this._alive) {
                return this;
            }
            var ress = this._results;
            var callback = this.callback;
            var failure  = this.failure;
            var dispose = this.dispose;

            this._tasks = null;
            this._taskcount = 0;
            this._results = null;
            this.callback = none;
            this.failure = none;
            this.dispose = none;

            // @TODO: Change where to run to finally.
            //dispose.call(this); // run the "dispose()"

            ress.shift(); // remove null-result created on first iterate

            try {
                if (callback) {
                    callback(err, ress);
                } else if (err) {
                    // if err and no callback,
                    // throw to exec failure callback
                    throw err;
                }
            } catch (ex) {
                if (failure) {
                    try {
                        failure(ex);
                    } catch (ex1) {
                        if (Bucks._isOnError) {
                            Bucks._onError(ex1, this);
                        } else {
                            throw ex1;
                        }
                    }
                } else {
                    // if err and no failure callback
                    // throw it
                    if (Bucks.DEBUG) {
                        // if DEBUG, logging
                        logError(ex);
                    }
                    if (Bucks._isOnError) {
                        Bucks._onError(ex, this);
                    } else {
                        throw ex;
                    }

                }
            } finally {

                try {
                    dispose.call(this); // run the "dispose()"
                } catch (ex1) {
                    if (Bucks._isOnError) {
                        Bucks._onError(ex1, this);
                    } else {
                        throw ex1;
                    }
                }


                delete this._alive;
                delete Bucks.running[this.__id];
                delete Bucks.living[this.__id];
                delete this.__id;
            }
            return this;
        },


        /**
         * チェインを完了し実行を開始します
         * @memberof Bucks
         * @instance
         * @param {function callback(err, res)} [callback] 最終コールバック関数 ressは各チェインの実行結果の配列
         * @param {function errback(err)} [errback] callbackでエラーが発生した場合のハンドラ
         */
        end: function end(callback, errback) {
            if (callback && callback.length < 1) {
                // if callback specified, it should be `callback(err, ress)`.
                // errが無視されると発生したエラーがどこにも出ずにデバッグが難しくなるので
                // callbackには引数を1つ以上指定することを強制しています
                throw new Error('callback args length invalid. should be `callback(err, ress)` or `callback(err)`.');
            }

            var self = this;

            this.callback = callback;
            this.failure  = errback;

            if (!this._tasks || !this._tasks.length) {
                var err = new Error('task is empty. add(task) first. if theres no task to execute but end is desired, empty() may be useful');
                this.destroy(err, null);
                return callback(err);
            }

            // add as running
            Bucks.running[this.__id] = this;

            this._iterator(); //execute

            return undefined;
        }
    };

    /**
     * parallel実行待ちをするためのクラスです。
     * 予め決められたsizeだけsuccessOneが呼ばれるとonFinishがコールされます。
     * @name ParallelHandler
     * @constructor
     * @private
     * @param {int} size  完了待ち数
     */
    var ParallelHandler = function ParallelHandler(size) {
        this._results = [];
        this._errors = [];
        this._waiting = size;
    };

    ParallelHandler.prototype = {

        /**
         * 全件完了するとコールされるコールバックを設定します。
         * @memberof ParallelHandler
         * @instance
         * @param {Function} callback callbackの形式はcallback({err:[], res:[]});
         */
        onFinish: function onFinish(callback) {
            this._onFinish = callback;
        },

        /**
         * 1件完了したことをこのParallelHandlerに通知します。
         * @memberof ParallelHandler
         * @instance
         * @param {int} idx 完了したタスクの番号
         * @param {Object} err エラーだった場合エラーオブジェクト
         * @param {Object} res resultオブジェクト
         */
        successOne: function successOne(idx, err, res) {
            this._errors[idx] = err;
            this._results[idx] = res;
            this._waiting--;
            if (this._waiting <= 0) {
                this._onFinish.call(null, this.resultObj);
            }
        }
    };

    /**
     * 現在の状態のresultObjを返します
     * @memberof ParallelHandler
     * @name resultObj
     * @instance
     * @property {{err:[], res:[]}} resultObj {err:[], res:[]}の形式
     */
    ParallelHandler.prototype.__defineGetter__('resultObj', function resultObj() {
        return {err: this._errors, res: this._results};
    });


    if (typeof define === 'function' && define.amd) {
        // requirejs
        define('beez-core/bucks',['require','exports','module'],function (require, exports, module) {
            return Bucks;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = Bucks;
    } else {
        // others, export global
        global.Bucks = Bucks;
    }

})(this);

/**
 * @name logcafe.js
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview browser logging.
 */

(function (global) {
    

    /**
     * Empty function
     * @function
     * @private
     */
    var none = function none() {};

    /**
     * Logger class
     * @class
     * @name Logger
     */
    var Logger = function Logger(category, config) {
        this.initialize(category, config);
    };

    Logger.prototype = {
        /**
         * Logger constructor
         * @param {String} category
         * @param {JSON} config config data
         * @memberof Logger
         * @instance
         */
        initialize: function initialize(category, config) {
            this.category = category;
            this.config = config;
            this.level = this.config.level;

            if (this.config.separator) {
                this.separator = this.config.separator || ' ';
            }

            if (this.level === this.LEVELS.TRACE) {
                // pass
            } else if (this.level === this.LEVELS.DEBUG) {
                this.trace = none;
            } else if (this.level === this.LEVELS.INFO) {
                this.trace = this.debug = none;
            } else if (this.level === this.LEVELS.WARN) {
                this.trace = this.debug = this.info = none;
            } else if (this.level === this.LEVELS.ERROR) {
                this.trace = this.debug = this.info = this.warn = none;
            } else {
                // pass
            }
        },

        /**
         * Log level
         * @const {string} LEVELS
         * @memberOf Logger
         */
        LEVELS: {
            'OFF': 'OFF',
            'TRACE': 'TRACE',
            'DEBUG': 'DEBUG',
            'INFO': 'INFO',
            'WARN': 'WARN',
            'ERROR': 'ERROR'
        },

        /**
         * Exclude category forward match
         * @memberOf Logger
         * @instance
         * @function
         * @private
         */
        _exclude: function _exclude() {
            if (this.config.excludes && 0 < this.config.excludes.length) {
                for (var i = 0; i < this.config.excludes.length; i++) {
                    var reg = new RegExp('^' + this.config.excludes[i]);
                    if (this.category.match(reg)) {
                        return true;
                    }
                }
            }
            return false;
        },


        /**
         * trace method
         * @memberOf Logger
         * @instance
         * @function
         */
        trace: function trace() {
            !this._exclude() && console.debug(this.output('trace', arguments));
        },

        /**
         * debug output method
         * @memberOf Logger
         * @instance
         * @function
         */
        debug: function debug() {
            !this._exclude() && console.debug(this.output('debug', arguments));
        },

        /**
         * info output method
         * @memberOf Logger
         * @instance
         * @function
         */
        info : function info() {
            !this._exclude() && console.info(this.output('info', arguments));
        },

        /**
         * warn output method
         * @instance
         * @memberOf Logger
         * @function
         */
        warn : function warn() {
            !this._exclude() && console.warn(this.output('warn', arguments));
        },

        /**
         * error output method
         * @instance
         * @memberOf Logger
         * @function
         */
        error: function error() {
            !this._exclude() && console.error(this.output('error', arguments));
        },

        /**
         * Generates a log record.
         * @memberof Logger
         * @instance
         * @function
         * @param {String} level log level
         * @param {Array} _arguments log datas
         * @return {String}
         */
        output: function output(level, _arguments) {
            var args = Array.prototype.slice.call(_arguments);

            for (var i = 0; i < args.length; i++) {
                if (args[i] === undefined) {
                    args[i] = '"undefined"';
                } else if (args[i] === null) {
                    args[i] = '"null"';
                } else if ((args[i] instanceof Error) || (args[i].constructor.name === 'Error')) {
                    var err = args[i];
                    err.stack ? args[i] = err.stack : args[i] = err.message;
                } else if (typeof args[i] === 'object') {
                    args[i] = args[i].constructor.name + ':' + JSON.stringify(args[i]);
                }
            }

            var suffix = '';
            var stack = new Error().stack;
            var lines, line, idx;
            if (stack) {
                lines = stack.split('\n');
                if (lines[3]) {
                    line = lines[3];
                    idx = line.indexOf('(');
                    if (idx >= 0) {
                        suffix = line.substring(idx);
                        if (suffix.charAt(suffix.length - 1) !== ')') {
                            suffix = '(' + suffix + ')';
                        }
                    } else {
                        suffix = '(' + line.replace(/[ ]*at /, '') + ')';
                    }
                } else if (lines[2]) {
                    line = lines[2];
                    idx = line.indexOf('@');
                    if (idx >= 0) {
                        suffix = line.substring(idx + 1);
                        suffix = ' (' + suffix + ')';
                    }

                }
            }

            return '[' + level + '][' + this.category + '] ' + args.join(this.separator) + ' ' + suffix;
        }
    };


    /**
     * Logging model
     * @class
     * @name LogCafe
     */
    var LogCafe = function LogCafe(config) {
        this.initialize(config);
    };
    LogCafe.prototype = {
        /**
         * Logging model
         * @memberof LogCafe
         * @instance
         */
        initialize: function initialize(config) {
            this.config = config;
            this.loggers = {};
        },

        /**
         * Setting up a configuration file.
         * @memberof LogCafe
         * @instance
         * @function
         * @public
         * @param {JSON} config config data
         */
        setConfigure: function setConfigure(config) {
            this.config = config;
            return this;
        },

        /**
         * Get Logger
         * @memberof LogCafe
         * @instance
         * @function
         * @public
         * @param {String} category
         * @return {Logger}
         */
        getLogger: function getLogger(category) {
            if (this.loggers[category]) {
                return this.loggers[category];
            }
            this.loggers[category] = new Logger(category, this.config);
            return this.loggers[category];

        }
    };

        /**
         * Version
         * @memberof LogCafe
         * @public
         */
    LogCafe.VERSION = '0.6.7';

    if (typeof define === 'function' && define.amd) {
        // requirejs
        define('beez-core/logcafe',['require','exports','module'],function (require, exports, module) {
            return LogCafe;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = LogCafe;
    } else {
        // others, export global
        global.LogCafe = LogCafe;
    }
})(this);

/**
 * @license beez Copyright (c) Cyberagent Inc.
 * Available via the MIT License.
 */

/**
 * @name index.js<beez-core>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview beez core
 */

(function (global) {

    /**
     * @namespace beez
     */
    define('beez.core',['require','exports','module','beez-core/suns','beez-core/error','beez-core/bucks','beez-core/logcafe'],function __Beez__(require, exports, module) {
        

        var root = global;
        if (root.beez) {
            return root.beez; // Read avoid double
        }

        var suns = require('beez-core/suns'); // suns.js
        var config = module.config() || {};
        var BeezError = require('beez-core/error');

        var Bucks = require('beez-core/bucks'); // bucks.js
        Bucks.extend = suns.extendThis;

        // beez-prefered logger
        var LogCafe = require('beez-core/logcafe');
        var logCafe = new LogCafe();

        // The default log definition
        logCafe.setConfigure(config.logging || {
            level: 'WARN',
            separator: ' '
        });

        /**
         * get logger object with specified category.
         *
         * @param {String} category
         * @return Logger
         * @public
         * @see LogCafe
         */
        var getLogger = function getLogger(category) {
            return logCafe.getLogger(category);
        };

        var logger = getLogger('beez.core.index');

        /**
         * onError handles uncaught error in chaining.
         * Override this function to customize.
         * @param {function} window window.onerror function
         * @param {function} bucks Bucks.onerror function
         * @param {function} requirejs require.onerror function
         * @function
         * @public
         */
        var onError = function onError(window, bucks, requirejs) {
            if (window) {
                global.onerror = window;
            }
            if (bucks) {
                Bucks.onError(bucks);
            }
            if (requirejs) {
                global.require.onError = requirejs;
            }
        };

        var defines = {};
        if (config.defines) {
            defines = config.defines;

            // Set the defines.global to the global scope
            if (defines.globals) {
                for (var key in defines.globals) {
                    global[key] = defines.globals[key];
                    logger.debug('Set the valueto the global scope.', key, ':', global[key]);
                }
            }
        }

        var beez = {

            /**
             * refs to global object
             * @member root
             * @type {Object}
             */
            root: root,

            /**
             * refs to global object
             * @member global
             */
            global: root,

            /**
             * configuration object. this comes from
             * requrejs.config['beez.core']
             * @member config
             */
            config: config,

            /**
             * Beez in the definition.
             * It is defined in the global (window object).
             * @borrows defines as defines
             * @member beez
             * @name defines
             * @example
             * file: conf/local/develop.json
             *
             * {
             *     ....
             *     "defines": {
             *         globals: { DEBUG : true }
             *     }
             *     ....
             * }
             */
            defines: defines,

            /**
             * Get logger of beez
             * no-op function.
             * @function
             */
            none: function none() {},

            /**
             * @function
             * @memberof beez
             * @borrows suns.extend as extend
             */
            extend: suns.extend,

            /**
             * suns.extendThis as extendThis
             * @function
             * @memberof beez
             * @borrows suns.extendThis as extendThis
             */
            extendThis: suns.extendThis,

            /**
             * suns.mixin as mixin
             * @function
             * @memberof beez
             * @borrows suns.mixin as mixin
             */
            mixin: suns.mixin,

            /**
             * Get logger of beez
             * @borrows getLogger as getLogger
             * @function
             */
            getLogger: getLogger,

            /**
             * beez common error.
             * @borrows onError as onError
             * @function
             */
            onError: onError,

            /**
             * beez error base class
             * @borrows BeezError as BeezError
             * @type {BeezError}
             */
            Error: BeezError,

            /**
             * Bucks class
             * @borrows Bucks as Bucks
             * @type {Bucks}
             */
            Bucks: Bucks
        };

        /**
         * window.beez
         * @global
         */
        root.beez = beez;

        return beez;
    });
})(this);


/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */
/**
 * @name index.js<beez-ua>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview UserAgent decision  for node and the browser. (amd support) fork zepto.js(http://zeptojs.com/)
 * @license MIT
 */

(function (global) {
    

    /**
     * @name ua
     * @namespace ua
     */
    var ua = {VERSION: '0.8.1'};

    /**
     * UserAgent decision
     *
     * @memberof ua
     * @method
     * @param {String} useragent user agent
     */
    ua.setup = function (useragent) {
        if (!useragent && global && global.navigator && global.navigator.userAgent) {
            // set browser user agent
            useragent = global.navigator.userAgent;
        }
        if (!useragent) {
            throw new Error('useragent setup error. useragent not found.');
        }

        /**
         * Decision: webkit
         * @name webkit
         * @memberof ua
         * @return {Array}
         */
        this.webkit = useragent.match(/WebKit\/([\d.]+)/),
        /**
         * Decision: android
         * @name android
         * @memberof ua
         * @return {Array}
         */
        this.android = useragent.match(/(Android)\s+([\d.]+)/),
        /**
         * Decision: android2.3
         * @name android
         * @memberof ua
         * @return {Array}
         */
        this.android23 = useragent.match(/(Android)\s+(2\.3)([\d.]+)/),
        /**
         * Decision: android4.x
         * @name android
         * @memberof ua
         * @return {Array}
         */
        this.android4 = useragent.match(/(Android)\s+(4)([\d.]+)/),
        /**
         * Decision: ipad
         * @name ipad
         * @memberof ua
         * @return {Array}
         */
        this.ipad = useragent.match(/(iPad).*OS\s([\d_]+)/),
        /**
         * Decision: iphone
         * @name iphone
         * @memberof ua
         * @return {Array}
         */
        this.iphone = !this.ipad && useragent.match(/(iPhone\sOS)\s([\d_]+)/),

        /**
         * Decision: webos
         * @name webos
         * @memberof ua
         * @return {Array}
         */
        this.webos = useragent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
        /**
         * Decision: touchpad
         * @name touchpad
         * @memberof ua
         * @return {Array}
         */
        this.touchpad = this.webos && useragent.match(/TouchPad/),
        /**
         * Decision: kindle
         * @name kindle
         * @memberof ua
         * @return {Array}
         */
        //this.kindle = useragent.match(/Kindle\/([\d.]+)/),
        this.kindle = useragent.match(/(Kindle)/),
        /**
         * Decision: silk
         * @name silk
         * @memberof ua
         * @return {Array}
         */
        //this.silk = useragent.match(/Silk\/([\d._]+)/),
        this.silk = useragent.match(/(Silk)/),

        /**
         * Decision: blackberry
         * @name blackberry
         * @memberof ua
         * @return {Array}
         */
        //this.blackberry = useragent.match(/(BlackBerry).*Version\/([\d.]+)/),
        this.blackberry = useragent.match(/(BlackBerry).*/),

        /**
         * Decision: bb10
         * @name bb10
         * @memberof ua
         * @return {Array}
         */
        this.bb10 = useragent.match(/(BB10).*Version\/([\d.]+)/),
        /**
         * Decision: rimtabletos
         * @name rimtabletos
         * @memberof ua
         * @return {Array}
         */
        this.rimtabletos = useragent.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
        /**
         * Decision: playbook
         * @name playbook
         * @memberof ua
         * @return {Array}
         */
        this.playbook = useragent.match(/PlayBook/),
        /**
         * Decision: chrome
         * @name chrome
         * @memberof ua
         * @return {Array}
         */
        this.chrome = useragent.match(/Chrome\/([\d.]+)/) || useragent.match(/CriOS\/([\d.]+)/),
        /**
         * Decision: firefox
         * @name firefox
         * @memberof ua
         * @return {Array}
         */
        this.firefox = useragent.match(/Firefox\/([\d.]+)/),
        /**
         * Decision: wii
         * @name wii
         * @memberof ua
         * @return {Array}
         */
        this.wii = useragent.match(/Nintendo (Wii);/),
        /**
         * Decision: ds
         * @name ds
         * @memberof ua
         * @return {Array}
         */
        this.ds = useragent.match(/Nintendo (DS|3DS|DSi);/),
        /**
         * Decision: ps3
         * @name ps3
         * @memberof ua
         * @return {Array}
         */
        this.ps3 = useragent.match(/PLAYSTATION 3/),
        /**
         * Decision: psp
         * @name psp
         * @memberof ua
         * @return {Array}
         */
        this.psp = useragent.match(/(PlayStation Portable)/),
        /**
         * Decision: psvita
         * @name psvita
         * @memberof ua
         * @return {Array}
         */
        this.psvita = useragent.match(/(PlayStation Vita)/),
        /**
         * Decision: Windows Phone
         * @name windowsphone
         * @memberof ua
         * @return {Array}
         */
        this.windowsphone = useragent.match(/(Windows Phone |Windows Phone OS )([\d.]+)/),
        /**
         * Decision: safari
         * @name safari
         * @memberof ua
         * @return {Array}
         */
        this.safari = useragent.match(/(Version)\/(\\d+)\\.(\\d+)(?:\\.(\\d+))?.*Safari\//)

        ;


        /**
         * Decision: iphone5
         * ToDo: need to check the evaluation method again after the release of iPhone5S(and later version)
         * @name iphone5
         * @memberof ua
         * @return {boolean}
         */
        this.iphone5 = !(typeof module !== 'undefined' && module.exports) && this.iphone && screen && screen.width === 320 && screen.height === 568;

        /**
         * Decision: iphone3
         * @name iphone3
         * @memberof ua
         * @return {boolean}
         */
        this.iphone3 = this.iphone && global.devicePixelRatio === 1 ? true : false;


        /**
         * browser information
         * @name browser
         * @memberof ua
         * @return {Object}
         */
        this.browser = {
            locale: undefined, // ja-JP, en-us
            lang: undefined, // ja, en ....
            country: undefined // JP, us ...
        };

        /**
         * os infomation
         * @name os
         * @memberof ua
         * @return {Object}
         */
        this.os = {};

        if (this.webkit) {
            this.browser.webkit = true;
            this.browser.version = this.webkit[1];
        }

        if (this.android) {
            this.os.android = true;
            this.os.version = this.android[2];
            try {
                this.browser.locale = useragent.match(/(Android)\s(.+);\s([^;]+);/)[3];
                this.browser.lang = this.browser.locale.substring(0, 2);
                this.browser.country = this.browser.locale.substring(3);
            } catch (e) {
                //console.log('Failed to parse user agent string of Android.', useragent);
            }
        }
        if (this.iphone) {
            this.os.ios = this.os.iphone = true;
            this.os.version = this.iphone[2].replace(/_/g, '.');

        }

        var __ios_v_0 = null;
        if (this.os.version) {
            __ios_v_0 = this.os.version.substring(0, 1);
        }
        for (var i = 3; i < 10; i++) { // IOS 3->9
            /**
             * Decision: ios 3-9
             * @name ios3-9
             * @memberof ua
             * @return {boolean}
             */
            this['ios' + i] = __ios_v_0 === "" + i;
        }

        if (this.ipad) {
            this.os.ios = this.os.ipad = true;
            this.os.version = this.ipad[2].replace(/_/g, '.');
        }
        if (this.webos) {
            this.os.webos = true;
            this.os.version = this.webos[2];
        }
        if (this.touchpad) {
            this.os.touchpad = true;
        }
        if (this.blackberry) {
            this.os.blackberry = true;
        }
        if (this.bb10) {
            this.os.bb10 = true;
            this.os.version = this.bb10[2];
        }
        if (this.rimtabletos) {
            this.os.rimtabletos = true;
            this.os.version = this.rimtabletos[2];
        }
        if (this.playbook) {
            this.browser.playbook = true;
        }
        if (this.kindle) {
            this.os.kindle = true;
        }
        if (this.silk) {
            this.browser.silk = true;
        }
        if (!this.silk && this.os.android && useragent.match(/Kindle Fire/)) {
            this.browser.silk = true;
        }
        if (this.chrome) {
            this.browser.chrome = true;
            this.browser.version = this.chrome[1];
        }
        if (this.firefox) {
            this.browser.firefox = true;
            this.browser.version = this.firefox[1];
        }
        if (this.wii || this.ds) {
            this.os.nintendo = true;
        }
        if (this.windowsphone) {
            this.browser.windowsphone = true;
            this.browser.version = this.windowsphone[2];
        }


        /**
         * Decision: table
         * @name table
         * @memberof ua
         * @return {boolean}
         */
        this.os.tablet = !!(this.ipad || this.kindle || this.playbook || (this.android && !useragent.match(/Mobile/)) || (this.firefox && useragent.match(/Tablet/)));

        /**
         * Decision: phone
         * @name phone
         * @memberof ua
         * @return {boolean}
         */
        this.os.phone  = !!(!this.os.tablet && (this.android || this.iphone || this.webos || this.blackberry || this.bb10 ||
                                                (this.chrome && useragent.match(/Android/)) || (this.chrome && useragent.match(/CriOS\/([\d.]+)/)) || (this.firefox && useragent.match(/Mobile/)) || (this.windowsphone && useragent.match(/IEMobile/))));
    };

    if (typeof define === 'function' && define.amd) {
        // requirejs
        define('beez.ua',['require','exports','module'],function (require, exports, module) {
            return ua;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = ua;
    } else {
        // others, export global
        if (!global.beez) {
            global.beez = {};
        }
        global.beez.ua = ua;
    }

})(this);


/**
 * @name browser.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview get browser info
 */

(function (global) {

    define('beez-utils/browser',['require','exports','module','beez.core','underscore','zepto','backbone','beez.ua'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var global = beez.global || global;

        var _ = require('underscore');
        var $ = require('zepto');
        var Backbone = require('backbone');

        /**
         * ブラウザの情報を取得するchainです。
         * ブラウザの情報は取得するためにdelayが必要な場合があり、
         * そのような情報をasync chainの形で取得できるようになっています
         * @class
         * @name BrowserAsync
         */
        var BrowserAsync = beez.Bucks.extend(
            'beez.utils.BrowserAsync',
            {
                initialize: function initialize(browser) {
                    this.browser = browser;
                },

                dispose: function dispose() {
                    delete this.browser;
                },

                /**
                 * アドレスバーを隠します
                 * delayをかけるのでonload時などに呼んでも動作します
                 * @memberof BrowserAsync
                 * @param {int} delay delay time(ms)
                 * @instance
                 * @return {BrowserAsync}
                 */
                hideAddress: function hideAddress(delay) {
                    delay = delay || 100;
                    return this
                        .delay(delay) // delayを挟む
                        .then(function scroll() {
                            window.scroll(0, 0);
                        });
                }

                /**
                 * 指定したelementのcomputedStyleを返します
                 * @memberof BrowserAsync
                 * @instance
                 * @param {HTMLElement} elem
                 * @return {BrowserAsync}
                 */
                //getComputedStyle: function getComputedStyle(elem) {
                //    var self = this;
                //    return this.then(function chainValue() {
                //        return self.browser.getComputedStyleSync(elem);
                //    });
                //},

                /**
                 * windowサイズを返します
                 * @memberof BrowserAsync
                 * @instance
                 * @return {BrowserAsync}
                 */
                //getWindowSize: function getWindowSize() {
                //    var self = this;
                //    return this.then(function chainValue() {
                //        return self.browser.getWindowSizeSync();
                //    });
                //}
            });

        var __Browser__ = {
            _prevOrientation: global.orientation,
            _initOrientation: global.orientation,

            /**
             * @memberof Browser
             * @instance
             */
            initialize: function initialize() {
                this.startHandleOrientation();
            },

            /**
             * 画面の回転イベントのbindを開始します。
             * @memberof Browser
             * @instance
             */
            startHandleOrientation: function startHandleOrientation() {
                // Androids don't have orientation change event
                var evName = ('onorientationchange' in window) ? 'orientationchange' : 'resize';
                // listen window's event
                var self = this;
                $(global).on(evName, function (ev) {
                    var o = global.orientation;

                    if (self._prevOrientation !== o) {
                        // trigger event
                        self.trigger(
                            'change:orientation',
                            {
                                prev: self._prevOrientation,
                                current: o,
                                init: self._initOrientation === o ? true : false
                            }
                        );
                        self._prevOrientation = o;
                    }
                });
            },

            /**
             * 指定されたelementのcomputedStyleを返します
             */
            getComputedStyle: function getComputedStyle(elem) {
                return document.defaultView.getComputedStyle(elem, '');
            },

            /**
             * 指定されたelementのcomputedStyleを返すchainを返します
             * then(callback)で値を受け取れます
             */
            //getComputedStyle: function getComputedStyle(elem) {
            //    return new BrowserAsync(this).getComputedStyle(elem);
            //},
            async: function async() {
                return new BrowserAsync(this);
            },

            /**
             * Addressbarを隠すchainを返します
             */
            hideAddress: function hideAddress(delay) {
                return new BrowserAsync(this).hideAddress(delay);
            },

            /**
             * windowサイズを返すchainを返します。
             * then(callback)で値を受け取れます
             *
             */
            //getWindowSize: function getWindowSize() {
            //    return new BrowserAsync(this).getWindowSize();
            //},

            /**
             * windowサイズを返します
             */
            getWindowSize: function getWindowSize() {
                return {width: window.innerWidth, height: window.innerHeight};
            },

            /**
             * @memberof Browser
             * @borrows Browser~ua as Browser#ua
             * @type {Browser~ua}
             */
            ua: {}, // injected below

            /**
             * Navigator Language default) 'en'
             * @memberof Browser
             * @return  {String}
             */
            getLanguage: function getLanguage() {
                var lang = navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage;

                // android 2.3 only!!!!
                if (this.ua.android23 && ua.browser.lang) {
                    return ua.browser.lang;
                }

                if (!lang) {
                    return undefined;
                }
                return lang.substr(0, 2);
            }
            //ua: require('beez.ua')
        };

        var ua = require('beez.ua');
        ua.setup(); // default browser useragent

        __Browser__.ua = ua;

        /**
         * ブラウザ情報の取得のためのクラスです。
         * 画面方向が変わるとchange:orientation イベントを発します
         * @class
         * @name Browser
         * @extends {Backbone.Events}
         */
        var Browser = beez.extend(
            'beez.utils.Browser',
            function Browser() {},
            Backbone.Events,
            __Browser__
        );

        return Browser;

    });
})(this);

/**
 * @name uid.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview generate uid
 */

(function (global) {
    define('beez-utils/uid',['require','exports','module'],function (require, exports, module) {
        
        var uid; // singleton

        /**
         * ユニークなIDを生成する
         * singletonオブジェクトです
         */
        var UID = function () {
            if (uid) { // return singleton
                return uid;
            }
            uid = this;
            return uid;
        };

        /**
         * ユニークなIDを生成します
         * @return {string} unique_id
         */
        UID.prototype.create = function () {
            var randam = Math.floor(Math.random() * 1000);
            var time = Date.now();
            return randam + '_' + time.toString();
        };

        return UID;
    });
})(this);

/**
 * @name timer.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview timers
 */

(function (global) {
    define('beez-utils/timer',['require','exports','module','beez.core','underscore','beez-utils/uid'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = require('underscore');
        var logger = beez.getLogger('timer');

        var UID = require('beez-utils/uid');
        var uid = new UID();

        var BEEZ_TIMER_ID_PROP = 'beez_utils_timer_id';

        /**
         * setIntervalひとつに複数のtimerを設定できる仕組みです。
         * 現在は誤差100msとなっています
         */
        var Timers = function () {
            this.running = false;
            this._callbacks = {};
            this._timerId = 0;
        };

        Timers.prototype = {

            /**
             * timeoutを追加する。
             * @param {Function} callback
             * @param {int} ms millisecond to timeout
             * @param {Object} context
             * @return {string} timerId
             */
            addTimeout: function addTimeout(callback, ms, context) {
                var id = uid.create();
                callback[BEEZ_TIMER_ID_PROP] = id;
                var callbackInfo = {

                    timer_id: id,
                    callback: callback,
                    interval: ms,
                    time: Date.now() + ms,
                    context: context,
                    type: 'timeout',
                    canceller: function canceller() {
                        this.type = 'canceled';
                    }
                };

                //_.bindAll(callbackInfo);
                _.bindAll.apply(this, [callbackInfo].concat(_.methods(callbackInfo)));

                this._callbacks[id] = callbackInfo;
                this.start();

                return id;
            },

            /**
             * intervalを追加する。
             * @param {Function} callback
             * @param {Object} context
             * @return {String} timerId
             */
            addInterval: function addInterval(callback, ms, context) {
                var id = uid.create();
                callback[BEEZ_TIMER_ID_PROP] = id;
                var callbackInfo = {
                    timer_id: id,
                    callback: callback,
                    interval: ms,
                    time: Date.now() + ms,
                    context: context,
                    type: 'interval',
                    canceller: function canceller() {
                        this.type = 'canceled';
                    }
                };

                //_.bindAll(callbackInfo);
                _.bindAll.apply(this, [callbackInfo].concat(_.methods(callbackInfo)));

                this._callbacks[id] = callbackInfo;
                this.start();

                return id;
            },

            /**
             * intervalを解除します
             * @param {Function|String} fnOrId addIntervalしたfunction, もしくは
             * その際に返ったtimer_id
             */
            clearInterval: function clearInterval(fnOrId) {
                var id;
                if (typeof fnOrId === 'function' && fnOrId[BEEZ_TIMER_ID_PROP]) {
                    id = fnOrId[BEEZ_TIMER_ID_PROP];
                } else {
                    id = fnOrId;
                }

                var callbackInfo = this._callbacks[id];
                if (!callbackInfo) {
                    throw new Error('no callback to clear');
                }
                callbackInfo.canceller();
            },

            /**
             * timeoutを解除します。clearIntervalと違うのは
             * すでにtimeoutしているなどしてclearしようとしたタイマーが
             * 存在しなかった場合も静かに無視します。
             * @param {Function|String} fnOrId addTimerしたfunction, もしくは
             * その際に返ったtimer_id
             */
            clearTimeout: function clearInterval(fnOrId) {
                var id;
                if (typeof fnOrId === 'function' && fnOrId[BEEZ_TIMER_ID_PROP]) {
                    id = fnOrId[BEEZ_TIMER_ID_PROP];
                } else {
                    id = fnOrId;
                }

                var callbackInfo = this._callbacks[id];
                if (!callbackInfo) {
                    return;
                }
                callbackInfo.canceller();

            },

            _tick: function _tick() {

                var now = Date.now();

                var self = this;
                _.each(this._callbacks, function (info) {
                    if (info.time < now) { // fire
                        if (info.type !== 'canceled') {
                            if (info.context) {
                                info.callback.call(null, info.context);
                            } else {
                                info.callback.call();
                            }
                        }
                        if (info.type !== 'interval') {
                            delete self._callbacks[info.timer_id];
                        }

                        info.time = now + info.interval;
                    }

                    return true;
                });

                if (!_.keys(this._callbacks).length) {
                    this.stop();
                }
            },

            /**
             * timerをstartします。通常はaddTimeout/addIntervalした際に
             * 自動的に実行されるので直接実行する必要はありません
             */
            start: function start() {
                if (this.running) {
                    return;
                }

                this.running = true;
                var self = this;

                var tickWrapper = function tickWrapper() {
                    if (self.running) {
                        self._tick();
                        self._timerId = setTimeout(tickWrapper, 100); // @TODO
                    }
                };
                tickWrapper();
            },

            /**
             * timerをstopします。またtimeoutが実行され終わったり
             * clearTimeout/clearIntervalによって実行待ちのコールバックが
             * ひとつも無くなった場合は自動的にstopが実行されます
             */
            stop: function stop() {
                this.running = false;
                clearTimeout(this._timerId);
            }
        };

        return Timers;
    });
})(this);

/**
 * @name index.js<beez-utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview Beez Utils class(define)
 */

(function (global) {
    /**
     * Beez utils
     * @namespace beez.utils
     */
    define('beez.utils',['require','exports','module','beez.core','underscore','beez-utils/browser','beez-utils/timer'],function __Utils__(require, module, exports) {
        

        var beez = require('beez.core');
        var _ = require('underscore');

        var logger = beez.getLogger('beez.utils');

        // double load check
        if (beez.utils) {
            logger.warn('beez.utils already defined.');
            return beez.utils;
        }

        var __Utils__ = {
            initialize: function initialize(opts) {
                var Browser = require('beez-utils/browser');
                var Timers = require('beez-utils/timer');

                /**
                 * instance of Browser
                 * @name browser
                 * @memberof beez.utils
                 * @type {Browser}
                 */
                this.browser = new Browser();

                /**
                 * class of Timers
                 * @name Timers
                 * @memberof beez.utils
                 * @type {Timers}
                 */
                this.Timers = Timers;

                this.none = beez.none;

                /**
                 * pixel ratio
                 *
                 * @name pixelRatio
                 * @memberof beez.utils
                 * @type {Timers}
                 */
                this.pixelRatio = global.devicePixelRatio || 1;
                //this.htmlRatio = this.pixelRatio;
            },
            /**
             * recursively copy the properties of src to dst
             * dst properties = object : merge
             * other properties (array, string, number .. ) : override
             *
             * @name copyr
             * @memberof beez.utils
             * @param {Object} dst
             * @param {Object} src
             * @return Object
             */
            copyr: function copyr(dst, src) {

                // for each props in src
                for (var k in src) {
                    var dstProp = dst[k];
                    var srcProp = src[k];
                    if (_.isObject(dstProp) && !_.isArray(srcProp)) {
                        copyr(dst[k], src[k]); // cp recursively
                    } else {
                        dst[k] = src[k]; // override/add property 'k'
                    }
                }
                return dst;
            },
            /**
             * To determine the type.
             *
             * @name is
             * @memberof beez.utils
             * @param {String} type
             * @param {Object} obj
             * @return boolean
             * @example
             * > beez.utils.is('Null'null) => true
             * > beez.utils.is('Array', []) => true
             * > beez.utils.is('Function', function () {}) => true
             * > beez.utils.is('String', "") => true
             * > beez.utils.is('Number', 1) => true
             * > beez.utils.is('Boolean', true) => true
             * > beez.utils.is('Number', Date.now()) => true
             * > beez.utils.is('RegExp', /^$/) => true
             * > beez.utils.is('Null', null) => true
             * > beez.utils.is('Undefined', undefined) => true
             *
             */
            is: function is(type, obj) {
                var clas = Object.prototype.toString.call(obj).slice(8, -1);
                return obj !== undefined && obj !== null && clas === type;
            }
        };


        var Utils = beez.extend(
            'beez.Utils',
            function constructor() {
                return this.initialize();
            }, __Utils__);

        // shortcut funciton os 'underscore.js#isXXX' function
        _.each(['Equal', 'Empty', 'Element', 'Arguments', 'Function', 'String', 'Number', 'Finite', 'Boolean', 'Date', 'RegExp', 'NaN', 'Null', 'Undefined'], function (type) {
            Utils.prototype['is' + type] = _['is' + type];
        });

        // shortcut function of 'is()' function
        _.each(['Object', 'Array'], function (type) {
            Utils.prototype['is' + type] = function (obj) {
                return this.is.apply(this, [type, obj]);
            };
        });

        beez.utils = new Utils();

        return beez.utils;
    });
})(this);


/**
 * @name index.js<beez-i18n>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * @overview Beez i18n class(define)
 */

(function (global) {

    /**
     * beez.i18n namespace
     * @namespace I18n
     */
    define('beez.i18n',['require','exports','module','beez.core','beez.utils','underscore','handlebars'],function __I18n__(require, exports, module) {
        

        var beez = require('beez.core');
        require('beez.utils');

        var logger = beez.getLogger('beez.i18n');
        var _ = require('underscore');

        if (beez.i18n) {
            logger.warn('beez.i18n is already loaded.');
            return beez.i18n;
        }

        var __I18n__ = {

            /**
             * Constructor
             * WARN: run only once from beez.i18n.setup
             *
             * @memberof I18n
             * @param {Object} options
             * @see beez.i18n.setup
             */
            initialize: function initialize(options) {
                /**
                 * @name lang
                 * @memberof I18n
                 * @type {Object}
                 */
                this.lang = {
                    base: 'en', // default lang
                    use: undefined // use lang
                };

                /**
                 * @name message
                 * @memberof I18n
                 * @type {Object}
                 */
                this.message = {};

                /**
                 * Regular expression extract string substitution.
                 *
                 * @name parseReg
                 * @memberof I18n
                 * @type {RegExp}
                 */
                //this.parseReg = new RegExp(/\{\{[(0-9a-zA-Z)]*\}\}/);
                this.parseReg = new RegExp(/\{#{1}[(0-9a-zA-Z)]*\}/);


                this.lang.use = beez.utils.browser.getLanguage();

                // override options
                options = options || {};
                options.lang = options.lang || {};

                if (options.lang.base) {
                    this.lang.base = options.lang.base;
                }
                if (options.lang.use) {
                    this.lang.use = options.lang.use;
                }

                //
                if (!this.lang.use) {
                    this.lang.use = this.lang.base;
                }

                if (options.message) {
                    this.message = options.message;
                }
            },

            /**
             * Name of the current language
             *
             * @memberof I18n
             * @instance
             * @public
             * @return {String}
             */
            getCurrentLang: function getCurrentLang() {
                return this.lang.use || this.lang.base;
            },

            /**
             * Replacement character string extraction.
             *
             * @memberof I18n
             * @instance
             * @public
             * @param {String} message
             * @param {Array} vars
             * @return {String}
             */
            parse: function (message, vars) {
                //var list = message.split(/\{\{[(0-9a-zA-Z)]*\}\}/);
                var list = message.split(this.parseReg);
                if (list.length === 1 && list[0] === '') {
                    return message;
                }

                var res = '';
                _.each(list, function (val, idx) {
                    res += val + (vars[idx] || '');
                });
                return res;
            },

            /**
             * Alias: I18n.getMessage()
             *
             * @memberof I18n
             * @instance
             * @public
             * @return {String}
             */
            __: function __(key) {
                return this.getMessage(key);
            },

            /**
             * I get the message corresponding to the current language
             *
             * @memberof I18n
             * @instance
             * @public
             * @return {String}
             */
            getMessage: function getMessage(key) {
                var lang = this.getCurrentLang();
                if (!this.message[lang]) {
                    lang = this.lang.base; // set default lang
                }
                if (!this.message[lang]) {
                    return ''; // not set!!
                }

                var message = this.message[lang][key] || '';
                if (!message && this.message[this.lang.base]) {
                    message = this.message[this.lang.base][key] || '';
                }
                var vars = Array.prototype.slice.call(arguments, 1);
                return this.parse(message, vars);
            },

            /**
             * Add data to a different message for the current language
             *
             * @memberof I18n
             * @instance
             * @public
             * @param {Object} obj
             * @return {Object}
             * @example
             * var res = beez.i18n.add({ja: {"taro": "太郎"}})
             * console.log(res)
             * >> {ja: {"taro": "太郎"}}
             */
            add: function add(obj) {
                return beez.utils.copyr(this.message, obj);
            },

            /**
             * Rewrite the message of one language
             *
             * @memberof I18n
             * @instance
             * @public
             * @param {String} lang example) 'en'
             * @param {Object} obj
             * @return {Object}
             * @example
             * var res = beez.i18n.addMessage(ja, {"taro": "太郎"});
             * console.log(res)
             * >> {"taro": "太郎"}
             */
            addMessage: function addMessage(lang, obj) {
                this.message[lang] = this.message[lang] || {};
                return beez.utils.copyr(this.message[lang], obj);
            },

            /**
             * Delete the message in another language
             *
             * @memberof I18n
             * @instance
             * @public
             * @param {String} lang example) 'en'
             * @param {String} key
             */
            remove: function remove(lang, key) {
                var obj = this.message[lang];
                if (obj && obj[key]) {
                    this.message[lang][key] = null;

                } else if (obj) {
                    this.message[lang] = null;

                } else {
                    this.message = {};
                }
            },

            /**
             * remove i18n data
             *
             * @memberof I18n
             * @instance
             * @public
             */
            dispose: function dispose() {
                delete this.lang;
                delete this.message;
                delete this.parseReg;
            }
        };

        var I18n = beez.extend(
            'beez.i18n',
            function constructor() {
                return this.initialize.apply(this, arguments);
            }, __I18n__);

        /**
         * beez.extendThis
         *
         * @memberof I18n
         * @instance
         * @public
         */
        I18n.extend = beez.extendThis;

        /**
         * @see I18n
         * @memberof beez
         * @instance
         * @public
         */
        beez.I18n = I18n;

        beez.i18n = {

            /**
             * i18n initialize
             *
             * @memberof I18n
             * @instance
             * @name setup
             * @param {I18n} I18n Class
             * @param {Object} options constructor/initialize arguments
             * @public
             * @example
             * beez.i18n.setup(null, {lang: {base: 'ja', use: 'ja'}});
             *
             */
            setup: function (options, Obj) {
                if (beez.i18n.initialize) {
                    logger.warn('Setup has already been. beez.i18n');
                    return beez.i18n;
                }

                // clear
                delete beez.i18n.setup;
                delete beez.i18n;

                if (!Obj) {
                    Obj = I18n;
                }

                /**
                 * i18n instance
                 * @memberof beez
                 * @instance
                 * @name i18n
                 * @public
                 */
                beez.i18n = new Obj(options);

                return beez.i18n;

            }
        };

        // ---
        // Add Handlebars Register Helper
        var Handlebars = require('handlebars');

        /**
         * i18n Handlebars Register Helper (escape OFF)
         *
         * @memberof beez.vendor.Handlebars.Helper
         * @instance
         * @name __
         * @public
         */
        Handlebars.registerHelper('__', function __(key) {
            if (beez.i18n) {
                var vars = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                return new Handlebars.SafeString(beez.i18n.getMessage.apply(beez.i18n, vars));
            }
            return '';
        });

        /**
         * i18n Handlebars Register Helper (escape ON)
         *
         * @memberof beez.vendor.Handlebars.Helper
         * @instance
         * @name __
         * @public
         */
        Handlebars.registerHelper('__e', function __e(key) {
            if (beez.i18n) {
                var vars = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                return beez.i18n.getMessage.apply(beez.i18n, vars);
            }
            return '';
        });

        return beez.I18n;
    });
})(this);


/**
 * @name base.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define('beez-mvcr/jsonpath',['require','exports','module','underscore'],function (require, exports, module) {
        

        var _ = require('underscore');

        // -------------------
        // JSONPath

        var cache = {}; // -- jsonpath implements


        /* JSONPath 0.8.0 - XPath for JSON
         *
         * Copyright (c) 2007 Stefan Goessner (goessner.net)
         * Licensed under the MIT (MIT-LICENSE.txt) licence.
         *
         * @license https://github.com/s3u/JSONPath
         */
        var jsonPath = function jsonPath(obj, expr, arg, testManaged) {
            var P = {
                resultType: arg && arg.resultType || "VALUE",
                flatten: arg && arg.flatten || false,
                wrap: (arg && arg.hasOwnProperty('wrap')) ? arg.wrap : true,

                normalize: function (expr) {
                    if (cache[expr]) {
                        return cache[expr];
                    }

                    var subx = [];
                    var ret =
                            expr.replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
                                return "[#" + (subx.push($1) - 1) + "]";
                            })
                            .replace(/'?\.'?|\['?/g, ";")
                            .replace(/;;;|;;/g, ";..;")
                            .replace(/;$|'?\]|'$/g, "")
                            .replace(/#([0-9]+)/g, function ($0, $1) {
                                return subx[$1];
                            });

                    cache[expr] = ret;
                    return ret;
                },
                asPath: function (path) {
                    var x = path.split(";"), p = "$";
                    for (var i = 1, n = x.length; i < n; i++) {
                        p += /^[0-9*]+$/.test(x[i]) ?
                            ("[" + x[i] + "]") : ("['" + x[i] + "']");
                    }
                    return p;
                },
                store: function (p, v) {
                    if (p) {
                        if (P.resultType === "PATH") {
                            P.result[P.result.length] = P.asPath(p);
                        } else {
                            if (_.isArray(v) && P.flatten) {
                                if (!P.result) { P.result = []; }
                                if (!_.isArray(P.result)) { P.result = [P.result]; }
                                P.result = P.result.concat(v);
                            } else {
                                if (P.result) {
                                    if (!_.isArray(P.result)) {
                                        P.result = [P.result];
                                    }

                                    if (_.isArray(v) && P.flatten) {
                                        P.result = P.result.concat(v);
                                    } else {
                                        P.result[P.result.length] = v;
                                    }
                                } else {
                                    P.result = v;
                                }
                            }
                        }
                    }
                    return !!p;
                },
                trace: function (expr, val, path) {

                    if (expr) {
                        var x = expr.split(";"), loc = x.shift();
                        x = x.join(";");
                        if (val && val.hasOwnProperty(loc)) {
                            P.trace(x, val[loc], path + ";" + loc);
                        } else if (loc === "*") {
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                P.trace(m + ";" + x, v, p);
                            });
                        } else if (loc === "..") {
                            P.trace(x, val, path);
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                typeof v[m] === "object" &&
                                    P.trace("..;" + x, v[m], p + ";" + m);
                            });
                        } else if (/,/.test(loc)) { // [name1,name2,...]
                            for (
                                var s = loc.split(/'?,'?/), i = 0, n = s.length;
                                i < n;
                                i++
                            ) {
                                P.trace(s[i] + ";" + x, val, path);
                            }
                        } else if (/^\(.*?\)$/.test(loc)) {// [(expr)]
                            /* jshint evil: true */
                            P.trace(
                                P.evaluate(
                                    loc, val, path.substr(path.lastIndexOf(";") + 1)
                                ) + ";" + x, val, path);
                        } else if (/^\?\(.*?\)$/.test(loc)) {// [?(expr)]
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                /* jshint evil: true */
                                if (P.evaluate(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) {
                                    P.trace(m + ";" + x, v, p);
                                }
                            });
                        } else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) {
                            // [start:end:step]  phyton slice syntax
                            P.slice(loc, x, val, path);
                        }
                    } else {
                        if (val && (_.isArray(val) || testManaged(val))) {
                            P.store(path, val);
                        }
                    }
                },
                walk: function (loc, expr, val, path, f) {
                    if (val instanceof Array) {
                        for (var i = 0, n = val.length; i < n; i++) {
                            if (i in val) {
                                f(i, loc, expr, val, path);
                            }
                        }
                    }
                    else if (typeof val === "object") {

                        //
                        // check if the object is managing object
                        // to avoid walking non-beez structure object
                        // added by maginemu
                        //
                        if (testManaged(val)) {
                            for (var m in val) {
                                if (val.hasOwnProperty(m)) {
                                    f(m, loc, expr, val, path);
                                }
                            }
                        }
                    }
                },
                slice: function (loc, expr, val, path) {
                    if (val instanceof Array) {
                        var len = val.length, start = 0, end = len, step = 1;
                        loc.replace(
                                /^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g,
                            function ($0, $1, $2, $3) {
                                start = parseInt($1 || start, 10);
                                end = parseInt($2 || end, 10);
                                step = parseInt($3 || step, 10);
                            }
                        );
                        start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                        end   = (end < 0)   ? Math.max(0, end + len)   : Math.min(len, end);
                        for (var i = start; i < end; i += step) {
                            P.trace(i + ";" + expr, val, path);
                        }
                    }
                },
                evaluate: function (x, _v, _vname) {
                    /* jshint evil: true */
                    try {
                        return $ && _v && eval(x);
                    } catch (e) {
                        throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/\^/g, "_a"));
                    } // `@` usecase removed from original
                }
            };
            P.result = P.wrap === true ? [] : undefined;

            var $ = obj;
            if (expr && obj && (P.resultType === "VALUE" || P.resultType === "PATH")) {
                P.trace(
                    P.normalize(expr).replace(/^\$;/, ""),
                    obj,
                    "$"
                );
                if (!_.isArray(P.result) && P.wrap) { P.result = [P.result]; }
                return P.result ? P.result : false;
            }
            return undefined;
        };

        return jsonPath;
    });

})(this);

/**
 * @name base.js<beez-mvcr>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp">
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define('beez-mvcr/base',['require','exports','module','beez.core','underscore','beez-mvcr/jsonpath'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = require('underscore');

        var jsonPath = require('beez-mvcr/jsonpath');

        var logger = beez.getLogger('beez.mvcr.base');

        // -------------------
        // ManagerBase

        /**
         * It provides a set of methods to deal with it and tree structure simple of Object.
         * Object of ManagerBase has properties of specific management
         *
         * @class
         * @name ManagerBase
         *
         * @example
         * var manager = new ManagerBase('idx');
         *
         * manager.add('/', {idx:'someObj'});
         * manager.get('/someObj') // => {idx:'someObj'}
         *
         * manager.add('/', [{idx:'button', name:'a'}, {idx:'button', name:'b'}]);
         * manager.get('/button') // => [{idx:'button', name:'a'}, {idx:'button', name:'b'}]
         * manager.get('/button[0]') // => {idx:'button', name:'a'}
         */
        var ManagerBase = beez.extend(
            'beez.manager.ManagerBase',
            function ManagerBase() {},
            {

                /**
                 * @constructor
                 * @memberof ManagerBase
                 * @param {String} idxProp base index name
                 */
                constructor: function constructor(idxProp) {

                    /**
                     * Objects that are managed
                     */
                    this.objs = {};

                    /**
                     * The assignment to the $ indicates the root
                     */
                    this.objs[idxProp] = '$';

                    /**
                     * Index for management
                     */
                    this._idxProp = idxProp || '';
                },

                /**
                 * Get idx of object
                 *
                 * @memberof ManagerBase
                 * @param {ManagerBase} obj
                 * @public
                 * @returns {String} idx
                 */
                getIdx: function getIdx(obj) {
                    return obj[this._idxProp];
                },


                /**
                 * put under control the specified Object
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} prefix
                 * @param {Object|Array<Object>} obj
                 *
                 * @example
                 * var mainModel = {
                 *   follower: [
                 *     followerModel1,
                 *     folloewrModel2
                 *   ]
                 * }
                 *
                 * var followerModel3, followingModel, buttonModel;
                 * followerModel3.midx = 'follower';
                 * followingModel.midx = 'following';
                 * buttonModel.midx = 'button';
                 *
                 * manager.model.add('/main', [followerModel, followingModel]);
                 *
                 * -> mainModel : {
                 *   follower:[
                 *     followerModel1
                 *     folloewrModel2,
                 *     folloewrModel3
                 *   ],
                 *   following:[
                 *     followingModel
                 *   ]
                 * }
                 *
                 * manager.model.add('/main', button);
                 * -> mainModel : {
                 *   follower:[
                 *     followerModel1,
                 *     folloewrModel2,
                 *     folloewrModel3
                 *   ],
                 *   following:[
                 *     followingModel
                 *   ],
                 *   button: buttonModel
                 * }
                 */
                add: function add(prefix, obj) {
                    var parent = this.get(prefix); // search parent from root object

                    // get parent or create waiting object
                    if (!parent) { throw new beez.Error('no parent exists. path: ' + prefix); }
                    if (_.isArray(parent)) { throw new beez.Error('parent is Array. Specify one by using `[number]` selector. parent: ' + parent); }

                    if (_.isArray(obj)) { // add as the children
                        _.each(obj, function (_obj) {
                            _obj.prefix = prefix; // keep prefix
                            var idx = this.getIdx(_obj);
                            if (!parent[idx]) { // make array
                                parent[idx] = [];
                            }
                            parent[idx].push(_obj);

                        }, this);
                    } else {
                        obj.prefix = prefix; // keep prefix
                        var idx = this.getIdx(obj);
                        if (parent[idx]) {
                            throw new beez.Error(
                                'Obj: adding object to same parent with same index. Add obj as Array to add several objs into same index. idx: ' + this.getIdx(obj));
                        }
                        parent[idx] = obj;
                    }

                    return this;
                },


                /**
                 * will remove from management the object that is specified in the path
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} path
                 */
                remove: function remove(path) {
                    var objs = this.get(path);
                    // get all children
                    var children = [];
                    var deletes;

                    if (!objs) { return; }

                    // now `views` is always Array
                    if (!_.isArray(objs)) { objs = [objs]; } // array-nize

                    _.each(objs, function (v) {
                        var c = this.getChildrenAll(v);
                        children = children.concat(c);
                    }, this);

                    // list to delete
                    // is children and this views
                    deletes = children.concat(objs);
                    // remove parent's reference
                    _.each(deletes, function (del) {
                        this.deleteFromParent(del);
                    }, this);

                    // call dispose of each views
                    _.each(deletes, function (v) {
                        //v.remove();
                        v.dispose && v.dispose();
                    });
                },

                /**
                 * Returns whether the object can be added to the manager.
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object} obj
                 * @returns {boolean}
                 */
                isAddable: function (obj) {
                    return !!this.getIdx(obj);
                },


                /**
                 * get an Object that is specified in the path
                 * Warnning: which was replaced by the '/' '.'.
                 *           no need for root $
                 *
                 * @see https://github.com/s3u/JSONPath
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} path
                 * @returns {Object}
                 */
                get: function get(path) {
                    if (path === undefined || typeof(path) !== 'string') {
                        return undefined;
                    }

                    if (/^\/$/.test(path)) {
                        return this.objs;
                    }

                    var self = this;
                    path = '$' + path.replace(/\//g, '.');
                    var result = jsonPath(
                        this.objs,
                        path,
                        {wrap: false},
                        function testAddable(obj) {
                            return self.isAddable(obj);
                        });
                    if (!result) {
                        return undefined;
                    }
                    return result;
                },


                /**
                 * get the parent. If obj is an array: I get the information from the parent of the first element
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object|Array.<Object>} obj
                 */
                getParent: function getParent(obj) {
                    if (_.isArray(obj)) {
                        return this.get(obj[0].prefix);
                    }
                    return this.get(obj.prefix);
                },


                /**
                 * will remove from the parent, a reference to objct specified.
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object|Array.<Object>} obj
                 */
                deleteFromParent: function deleteFromParent(obj) {
                    if (!obj) {
                        return;
                    }

                    var parent = this.getParent(obj);
                    if (_.isArray(obj)) {
                        delete parent[this.getIdx(obj[0])];
                    } else {
                        delete parent[this.getIdx(obj)];
                    }
                },


                /**
                 * get the child list of just under
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object} obj
                 * @return {Array.<Object>}
                 */
                getChildren: function getChildren(obj) {
                    var result = [];
                    var self = this;

                    var _walk = function _walk(list) {
                        _.each(list, function (item) {
                            if (!item) {
                                return;
                            }

                            if (_.isArray(item)) {
                                _walk(item);
                            } else if (self.getIdx(item)) {
                                result.push(item);
                            }
                        });
                    };

                    _walk(obj);
                    return result;
                },


                /**
                 * You get as an array all the specified Object (recursively)
                 *
                 * @memberof ManagerBase
                 * @param {Object} data
                 * @return {Array.<Object>}
                 */
                getChildrenAll: function getChildrenAll(data) {
                    var result = [];
                    var self = this;

                    var _walk = function _walk(obj) {
                        var list = obj;
                        if (!_.isArray(obj)) {
                            list = _.values(obj);
                        }
                        _.each(list, function (item, idx) {
                            if (!item) {
                                return;
                            }
                            if (_.isArray(item)) {
                                _walk(item);

                            } else if (self.getIdx(item)) {

                                if (!item.prefix || !item.manager) { // Item that is not managed to ignore
                                    logger.warn("Manager ignore the Object haven't been manaegd.", item);
                                    // result.push(item); // Do not ignore
                                    return;
                                }

                                // Ignore the member variable Object has set manually by user.
                                if (obj[self._idxProp] !== '$' && !_.isArray(obj) && item.getParent()[self._idxProp] !== obj[self._idxProp]) {
                                    logger.warn("Manager ignore the Object haven't been manaegd.",
                                                'Path that is managed:', self.pathOf(item), // The paths managed the Object of interest
                                                'Path to the specified:', self.pathOf(obj) // The actual path
                                                );
                                    return;
                                }
                                _walk(item); // Child is at the beginning of the Array
                                result.push(item);

                            }
                        });
                    };

                    // walk start
                    _walk(data);
                    return result;
                },


                /**
                 * Returns the path of the Object being managed. If the Object is array, returns the first element.
                 *
                 * @memberof ManagerBase
                 * @param {String} prefix
                 * @param {Object|Array} obj
                 * @throw {Error} obj is empty array
                 * @throw {Error} object.prefix does not exist
                 * @return {String}
                 */
                pathOf: function pathOf(obj) {
                    var prefix = '';
                    if (_.isArray(obj)) {
                        if (_.isEmpty(obj)) {
                            throw new beez.Error('pathOf: obj is empty array.');
                        }
                        obj = obj[0];
                    }

                    prefix = obj.prefix;

                    if (!prefix) {
                        throw new beez.Error('pathOf: object.prefix does not exist.');
                    }
                    return prefix + ((/^\/$/.test(prefix)) ? '' : '/') + this.getIdx(obj);
                },


                /**
                 * Returns the information Objects are managed.
                 *
                 * @memberof ManagerBase
                 * @return {Object}
                 */
                trace: function trace() {

                    var pairs = {};

                    // all children
                    var all = this.getChildrenAll(this.objs);

                    // for each child, make path & store
                    var self = this;
                    _.each(all, function (obj) {

                        if (!obj) {
                            return;
                        }

                        // make path
                        var key;
                        if (obj.prefix === '/') { // if parent is root
                            key = obj.prefix + self.getIdx(obj);
                        } else {
                            key = obj.prefix + '/' + self.getIdx(obj);
                        }

                        // store
                        if (pairs[key]) { // if already exists
                            if (!_.isArray(pairs[key])) {
                                // at first time, make array
                                pairs[key] = [pairs[key]];
                            }
                            pairs[key].push(obj); // push
                        } else {
                            // as sigle object
                            pairs[key] = obj;
                        }
                    });

                    return pairs;
                },
                dispose: function dispose() {
                    delete this.objs;
                    delete this._idxProp;
                }
            }
        );

        // -------------------
        // Base

        /**
         * This is the base class of an Object managed by the Manager.
         *
         * @class
         * @name Base
         */
        var Base = beez.extend(
            'beez.mvcr.Base',
            function Base() {},
            {
                /**
                 * get the first element. Gets the parent. If object is an array, sets the first
                 *
                 * @memberof Base
                 * @instance
                 */
                getParent: function getParent() {
                    return this.manager.getParent(this);
                },

                /**
                 * delete the reference of Object from a parent
                 *
                 * @memberof Base
                 * @instance
                 */
                deleteFromParent: function deleteFroParent() {
                    return this.manager.deleteFromParent(this);
                },

                /**
                 * I acquire a list of children underneath.
                 *
                 * @memberof Base
                 * @instance
                 * @return {Array.<Object>}
                 */
                getChildren: function getChildren() {
                    return this.manager.getChildren(this);
                },

                /**
                 * I acquire all Object of the descendant as an arrangement.
                 *
                 * @memberof Base
                 * @instance
                 * @return {Array.<Object>}
                 */
                getChildrenAll: function getChildrenAll() {
                    return this.manager.getChildrenAll(this);
                },


                /**
                 * Sets the object beneath the specified prefix.
                 *
                 * @memberof Base
                 * @param {String} prefix prefix name
                 */
                alias: function alias(prefix) {
                    return this.manager.add(prefix, this);
                }
            }
        );

        return {
            ManagerBase: ManagerBase,
            Base: Base
        };

    });

})(this);

/**
 * @fileOverview Model
 * @name model.js<beez-mvcr>
 * @author Kazuma Mishimagi <mishimagi_kazuma@cyberagent.co.jp>
 * @overview Model management functions
 */

(function (global) {

    /**
     * Model module
     * @exports beez-mvcr/model
     */
    define('beez-mvcr/model',['require','exports','module','beez.core','underscore','backbone','zepto','beez-mvcr/base'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = require('underscore');
        var Backbone = require('backbone');
        var $ = require('zepto');

        var base = require('beez-mvcr/base');
        var Base = base.Base;
        var ManagerBase = base.ManagerBase;

        var logger = beez.getLogger('beez.mvcr.model');

        // -------------------
        // ModelManagerAsync

        /**
         * Model management class. asynchronous
         *
         * @class
         * @name ModelManagerAsync
         * @extends {Bucks}
         */
        var ModelManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ModelManagerAsync',
            {
                initialize: function initialize(manager) {
                    this.manager = manager;
                    this.current = undefined;
                    this.root = undefined;
                },

                /**
                 * set root
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                //root: function root(RootView) {
                //var self = this;
                //    return this.then(function () {
                //        return self.manager.root(RootView);
                //    });
                //},

                /**
                 * Generate Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Model|Array<Model>} Model Generate model object.
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {ModelManagerAsync}
                 */
                create: function create(prefix, Model, attributes, options) {
                    var self = this;
                    return this.then(function () {
                        var v = self.manager.create(prefix, Model, attributes, options);
                        self.root = self.current = v;
                        self.create = function create_twice() {
                            throw new beez.Error('create called more than once!');
                        };
                        return v;
                    });
                },

                /**
                 * Generate collection.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Collection|Array<Model>} Collection Generate collection object.
                 * @param {Array<Object>} models Model(s)
                 * @param {Object|Array<Object>} options Collection to generate a options
                 * @return {ModelManagerAsync}
                 */
                createCollection: function createCollection(prefix, Collection, models, options) {
                    var self = this;
                    return this.then(function () {
                        var c = self.manager.createCollection(prefix, Collection, models, options);
                        self.root = self.current = c;
                        self.createCollection = function createCollection_twice() {
                            throw new beez.Error('create called more than once!');
                        };
                        return c;
                    });
                },

                /**
                 * Get the child Model
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {Model|Array<Model>} Model Generate model object.
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {ModelManagerAsync}
                 */
                child: function child(Model, attributes, options) {
                    var self = this;
                    return this.then(function () {
                        if (!self.root) {
                            throw new beez.Error('No chain root exists. `create` first.');
                        }
                        var prefix = self.manager.pathOf(self.current);
                        var v = self.manager.create(prefix, Model, attributes, options);
                        self.current = _.isArray(v) ? v[0] : v;
                    });
                },

                /**
                 * I acquire a parent of Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                parent: function parent() {
                    var self = this;
                    return this.then(function () {
                        self.current = self.manager.getParent(self.current);
                        if (!self.current) {
                            throw new beez.Error('get parent failed');
                        }
                    });
                },


                /**
                 * The child and its brother of the parents of Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {Model|Array<Model>} brother object.
                 * @param {Object|Array<Object>} [attributes] constructor a attributes
                 * @param {Object|Array<Object>} [options] constructor a options
                 * @return {ModelManagerAsync}
                 */
                bro: function bro(brother, attributes, options) {
                    return this.parent().child(brother, attributes, options);
                },


                /**
                 * Disposes of the instance
                 *
                 * @override
                 * @memberof ModelManagerAsync
                 */
                dispose: function dispose() {
                    logger.debug("ModelManagerAsync dispose");
                    delete this.manager;
                    delete this.current;
                    if (this.root && this.root.dispose) {
                        this.root.dispose();
                    }
                    delete this.root;
                }
            }
        );


        // -------------------
        // ModelManager

        /**
         * ModelManager Class
         *
         * @class
         * @name ModelManager
         */
        var ModelManager = beez.extend(
            'beez.mvcr.ModelManager',
            ManagerBase,
            {
                /**
                 * Constructor
                 *
                 * @memberof ModelManager
                 */
                initialize: function initialize() {
                    this.constructor.__super__.initialize.call(this, 'midx');
                },

                /**
                 * Generating ModelManagerAsync
                 *
                 * @memberof ModelManager
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                async: function async() {
                    return new ModelManagerAsync(this);
                },

                /**
                 * Set the Root Model
                 *
                 * @memberof ModelManager
                 * @param {Model} RootModel
                 * @return {Model}
                 */
                root: function root(RootModel) {
                    var rootModel = new RootModel(this);
                    var root = this.get('/@');
                    if (root) {
                        throw new beez.Error('root already exists!');
                    }

                    if (rootModel.midx !== '@') {
                        throw new beez.Error('roots midx must be "@"');
                    }
                    this.add('/', rootModel);

                    return rootModel;
                },

                /**
                 * Generate Model. Add a managed object
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {String} prefix parent prefix.
                 * @param {Model|Array<Model>} Model Generate model object(s).
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {Model}
                 */
                create: function create(prefix, Model, attributes, options) {

                    if (!Model || (!_.isArray(Model) && typeof Model !== 'function')) {
                        var msg = 'Model does not exist / does not be funciton. ' + 'Specified prefix: ' + prefix;
                        throw new beez.Error(msg);
                    }

                    if (Model instanceof Collection) {
                        throw new beez.Error('Collection specified.  Use #createCollection instead.');
                    }

                    if (!prefix) { // prefix check
                        throw new beez.Error('No prefix specified. Creating:' + Model.name);
                    } else if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + Model.name);
                    }

                    if (!this.get(prefix)) { // no parent
                        throw new beez.Error('no parent exists. prefix: ' + prefix + ' ,  Please consider constructing in Controller and so on.');
                    }

                    if (_.isArray(Model)) {
                        return this._createArray(prefix, Model, attributes, options);
                    }

                    return this._createObj(prefix, Model, attributes, options);
                },

                _createObj: function _createObj(prefix, Model, attribute, option) {
                    var m = new Model(attribute, option, this);

                    if (!this.isAddable(m)) {
                        throw new beez.Error('index does not exists in the Model. :' + m);
                    }
                    this.add(prefix, m);

                    return m;
                },

                _createArray: function _createArray(prefix, Models, attributes, options) {
                    // make to array when params aren't array
                    if (attributes && !_.isArray(attributes)) {
                        attributes = [attributes];
                    }

                    if (options && !_.isArray(options)) {
                        options = [options];
                    }
                    var self = this;
                    var instances = [];
                    _.each(Models, function (C, idx) {
                        var attr = attributes ? attributes[idx] : undefined;
                        var opt = options ? options[idx] : undefined;
                        instances.push(new C(attr, opt, self));
                    });

                    _.each(instances, function (model) {
                        if (!this.isAddable(model)) {
                            throw new beez.Error('index does not exist in the Model. :' + model);
                        }
                    }, this);

                    this.add(prefix, instances);

                    return instances;
                },

                /**
                 * Generate collection.
                 *
                 * @memberof ModelManager
                 *
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {Collection} Collection Generate collection object.
                 * @param {Object} [attributes] Collection to generate a attributes
                 * @param {Object} [options] Collection to generate a options
                 * @return {Model}
                 */
                createCollection: function createCollection(prefix, Collection, models, options) {
                    if (!Collection || typeof Collection !== 'function') {
                        var msg = 'Collection does not exist / does not be funciton. ' +
                                'Specified prefix: ' + prefix;
                        throw new beez.Error(msg);
                    }

                    if (!prefix) { // prefix check
                        throw new beez.Error('No prefix specified. Creating:' + Collection.name);
                    }
                    if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + Collection.name);
                    }

                    var c = new Collection(models, options, this);

                    this.add(prefix, c);

                    return c;
                },

                _newAll: function _newAll(ctor, attributes, options) {

                    if (!ctor) {
                        throw new beez.Error('ctor does not exist.');
                    }

                    if (!_.isArray(ctor)) {
                        ctor = [ctor];
                    }

                    if (attributes && !_.isArray(attributes)) {
                        attributes = [attributes];
                    }

                    if (options && !_.isArray(options)) {
                        options = [options];
                    }


                    var instances = [];
                    _.each(ctor, function (C, idx) {
                        var attrs = attributes ? attributes[idx] : undefined;
                        var opts = options ? options[idx] : undefined;
                        instances.push(new C(attrs, opts));
                    });

                    return instances;
                },

                /**
                 * _decideBindedModel
                 *
                 * @memberof ModelManager
                 * @instance
                 * @private
                 * @param {Object} obj
                 * @param {Boolean} isCollection
                 * @return object
                 */
                _decideBindedModel: function _decideBindedModel(obj, isCollection) {
                    var model;
                    var returnedModel;
                    var children;

                    if (!isCollection) {
                        model = obj;
                        children = [];

                        _.each(model, function (v) {
                            var c = this.getChildrenAll(v);
                            children = children.concat(c);
                        }, this);

                        var candidates = children.concat(model);

                        // remove still binded models
                        var deletes = _.reject(candidates, function (d) {
                            return d.isBinded();
                        });

                        // models in diff still have some bindings
                        var diff = _.difference(candidates, deletes);
                        _.each(diff, function (model) {
                            throw new beez.Error('a disposing model have some bindings. models cid: ' + model.cid);
                        });

                        returnedModel = deletes;
                    } else {
                        returnedModel = obj;
                    }

                    return returnedModel;
                },
                /**
                 * model or collection specified by path is canceled and it removes from management. delete the descendants.
                 * If the binding is not removed. If the reference may be state without properly.
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {String} path
                 * @param {Object} options @see backbone.js#Collection.remove()
                 */
                remove: function remove(path, options) {
                    logger.debug("ModelManager remove");

                    var objs = this.get(path);
                    if (!objs) {
                        logger.debug('Path of unmanaged become subject to deletion, I was skipped. path:', path);
                        return this;
                    }

                    if (objs.isCollection()) {
                        this._decideBindedModel(objs, true).removeAll &&
                        this._decideBindedModel(objs, true).removeAll(options);

                        this.deleteFromParent(objs);

                        return this;
                    }

                    if (objs && !_.isArray(objs)) {
                        objs = [objs];
                    }
                    // remove refference
                    _.each(this._decideBindedModel(objs), function (d) {
                        this.deleteFromParent(d);
                    }, this);

                    // dispose
                    _.each(this._decideBindedModel(objs), function (d) {
                        d.dispose && d.dispose();
                    });

                    return this;
                },

                /**
                 * Supports asynchronous communication.
                 *
                 * @memberof ModelManager
                 * @instance
                 */
                ajax: {
                    sync: function sync(method, options) {
                        var configAjax = beez.config.ajax || {};
                        _.defaults(options || (options = {}), {
                            type: method,
                            emulateHTTP: !!configAjax.emulateHTTP
                        });
                        var beforeSend = options.beforeSend || function () {};

                        if (options.emulateHTTP && (method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
                            options.type = 'POST';
                        }

                        options.beforeSend = function (xhr) {
                            if (options.emulateHTTP && (method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
                                xhr.setRequestHeader('X-HTTP-Method-Override', method);
                            }

                            beforeSend.apply(null, arguments);
                        };

                        return $.ajax(options);
                    },
                    get: function (options) {
                        return this.sync('GET', options);
                    },
                    post: function (options) {
                        return this.sync('POST', options);
                    },
                    put: function (options) {
                        return this.sync('PUT', options);
                    },
                    'delete': function (options) {
                        return this.sync('DELETE', options);
                    },
                    patch: function (options) {
                        return this.sync('PATCH', options);
                    }
                },

                /**
                 * Dispose self instance and models belong to.
                 *
                 * @name dispose
                 * @memberof ModelManager
                 * @instance
                 */
                dispose: function dispose() {
                    var managedChildren = this.getChildrenAll(this.objs);

                    logger.debug('ModelManager dispose');

                    _.each(managedChildren, function (key) {
                        key.dispose();
                    });

                    delete this.urlRoot;

                    ModelManager.__super__.dispose.apply(this, arguments);
                }
            }
        );

        /**
         * Model Class. asynchronous
         * @class
         * @name ModelAsync
         */
        var ModelAsync = beez.Bucks.extend(
            'beez.mvcr.ModelAsync',
            {

                initialize: function initialize(model) {
                    this.model = model;
                },

                /**
                 * From the data source and retrieve data.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#fetch
                 */
                fetch: function fetch(options) {

                    var model = this.model;
                    return this.then(function waitCb(res, next) {

                        options = options ? _.clone(options) : {};

                        options.success = function (model, res) {
                            next(null, {model: model, res: res});
                        };
                        options.error = function (model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };

                        model.fetch(options);
                    });
                },

                /**
                 * Update the data in the data source.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#save
                 */
                save: function save(key, val, options) {
                    /* jshint eqeqeq: false, eqnull: true */
                    var attrs;

                    // Handle both `"key", value` and `{key: value}` -style arguments.
                    if (key == null || _.isObject(key)) {
                        attrs = key;
                        options = val;
                    } else if (key != null) {
                        (attrs = {})[key] = val;
                    }

                    var model = this.model;
                    return this.then(function waitCb(res, next) {

                        options = options ? _.clone(options) : {};

                        options.success = function success(model, res) {
                            next(null, {model: model, res: res});
                        };

                        options.error = function error(model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };

                        model.save(attrs, options);
                    });
                },

                /**
                 * Delete the data in the data source.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#destroy
                 */
                destroy: function destroy(options) {

                    var model = this.model;
                    return this.then(function waitCb(res, next) {
                        options = options ? _.clone(options) : {};

                        options.success = function success(model, res) {
                            next(null, {model: model, res: res});
                        };

                        options.error = function error(model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };

                        model.destroy(options);
                    });
                },

                /**
                 * dispose this chain
                 * @memberof ModelAsync
                 * @instance
                 * @private
                 * @override
                 */
                dispose: function dispose() {
                    logger.debug("ModelAsync dispose");
                    delete this.model;
                }
            }
        );


        // -------------------
        // Model

        /**
         * Model class.
         *
         * @constructor
         * @name Model
         * @extends {Backbone.Model}
         * @see Backbone.Model
         */
        var Model = beez.extend(
            'beez.mvcr.Model',
            Base,
            Backbone.Model.prototype,
            /**
             * @lends module:beez-mvcr/model~Model.prototype
             */
            {
                /**
                 * @memberof Model
                 */
                constructor: function constructor(attribute, options, manager) {
                    var args = Array.prototype.slice.call(arguments);

                    options = options || {};
                    // data source access root url.
                    options.urlRoot = options.urlRoot || beez.config.url.api;

                    // Model's constructor.
                    if ((args.length === 1 && args[0].objs) ||
                        (args.length === 2 && args[1].objs) ||
                        (args.length === 3 && args[2].objs)) {
                        this.manager = args[args.length - 1];
                    }

                    if (!this.manager) {
                        logger.debug("Manager can't be managed this model.");
                    }
                    // call Backbone.constructor
                    //
                    // Warning: `Model.__supersuper__.constructor` can't use in here.
                    // Because `Backbone.Model.constructor` call `Backbone.Medel.
                    // initialize`, so call `Backbone.Model.constructor` directory.
                    Model.__super__.constructor.call(this, attribute, options);
                },

                /**
                 * call initialize method
                 *
                 * @memberof Model
                 * @name initialize
                 * @override Backbone.Model.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.Model.initialize
                    Model.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for Model management.
                 *
                 * @memberof Model
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,

                /**
                 * Generating ModelAsync
                 *
                 * @memberof Model
                 * @instance
                 * @return {ModelAsync}
                 */
                async: function async() {
                    return new ModelAsync(this);
                },

                /**
                 * Collection Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isCollection: function isCollection() {
                    return false;
                },

                /**
                 * Model Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isModel: function isModel() {
                    return true;
                },

                /**
                 * Binding exists
                 *
                 * @memberof Model
                 * @instance
                 * @return {boolean}
                 */
                isBinded: function isBinded() {
                    if (this._events) {
                        var i, l, name, names, list, events;
                        names = _.keys(this._events);
                        for (i = 0, l = names.length; i < l; i++) {
                            name = names[i];
                            list = this._events[name];
                            if (list && list.length > 0) {
                                return true;
                            }
                        }
                    }
                    return false;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof Model
                 * @instance
                 */
                dispose: function dispose() {
                    logger.debug('Model dispose');

                    delete this.manager;
                    delete this.cid;
                    delete this.attributes;
                    // delete this.url;
                    // delete this.urlRoot;
                    delete this.collection;

                    // Model.__super__.dispose.apply(this, arguments);
                },
                /**
                 * Do nothing but throw error.
                 *
                 * @name remove
                 * @function
                 * @memberof Model
                 * @instance
                 * @return Error
                 */
                remove: function remove() {
                    throw new beez.Error('Use Backbone.model.destroy() or Model.dipose() instead of this');
                }
            }
        );

        /**
         * @memberof Model
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @see {beez}
         * @example
         * var MyModel = Model.extend(
         *     'myapp.MyModel'
         *     {
         *         midx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        Model.extend = beez.extendThis;


        // -------------------
        // CollectionAsync

        /**
         * Collection class. asynchronous
         *
         * @class
         * @name ModelAsync
         * @extends {Bucks}
         */
        var CollectionAsync = beez.Bucks.extend(
            'beez.mvcr.CollectionAsync',
            {
                initialize: function initialize(collection) {
                    this.collection = collection;
                    //_.each(Collection.__superCtor__.prototype, function(obj, idx) {});
                },
                /**
                 * New collection
                 *
                 * @memberof CollectionAsync
                 * @instance
                 * @return {Collection}
                 */
                create: function create(model, options) {
                    var self = this;
                    return this.then(function () {
                        return self.collection.create(model, options);
                    });
                },
                /**
                 * Remove collection
v                 *
                 * @memberof CollectionAsync
                 * @instance
                 * @return {Collection}
                 */
                remove: function remove(models, options) {
                    var self = this;
                    return this.then(function () {
                        return self.collection.remove(models, options);
                    });
                },
                /**
                 * @override Backbone.Collection#_reset
                 * @see Backbone.Collection#_reset
                 * @memberof CollectionAsync
                 * @instance
                 */
                _reset: function () {
                    var self = this;
                    return this.then(function () {
                        return self.collection._reset();
                    });
                },

                /**
                 * Disposes of the instance
                 *
                 * @override
                 * @memberof CollectionAsync
                 */
                dispose: function dispose() {
                    logger.debug('CollectionAsync dispose');
                    delete this.collection;
                }
            }
        );


        // -------------------
        // Collection

        /**
         * Collection class.
         *
         * @constructor
         * @name Collection
         * @extends {Backbone.Collection}
         * @see Backbone.Collection
         */
        var Collection = beez.extend(
            Base,
            Backbone.Collection.prototype,
            {
                /**
                 * @memberof Collection
                 */
                constructor: function constructor(models, options, manager) {
                    /**
                     * default model
                     * @memberof Collection
                     * @type {Model}
                     */
                    if (!this.model) { this.model = Model; }

                    /**
                     * @override
                     * @memberof Collection
                     * @instance
                     */
                    this.urlRoot = (function urlRoot() {
                        return beez.config.url.api;
                    }());
                    // Collection's constructor.
                    this.manager = manager;
                    var newArgs = arguments;
                    if (3 <= arguments.length) {
                        newArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                    }
                    Collection.__super__.constructor.apply(this, newArgs);
                },

                /**
                 * call initialize method
                 *
                 * @memberof Collection
                 * @name initialize
                 * @override Backbone.Collection.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.Collection.initialize()
                    Collection.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for Model management.
                 *
                 * @memberof Collection
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,

                /**
                 * Generating Collection.
                 *
                 * @memberof Collection
                 * @instance
                 * @return {Collection}
                 */
                async: function async() {
                    return new CollectionAsync(this);
                },

                /**
                 * Collection Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isCollection: function isCollection() {
                    return true;
                },

                /**
                 * Model Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isModel: function isModel() {
                    return false;
                },

                /**
                 *
                 * @memberof Collection
                 * @override
                create: function create(model, options) {
                    options = options ? _.clone(options) : {};
                    if (!(model = this._prepareModel(model, options))) { return false; }
                    if (!options.wait) { this.add(model, options); }
                    var collection = this;
                    var success = options.success;
                    options.success = function (model, resp, options) {
                        if (options.wait) { collection.add(model, options); }
                        if (success) { success(model, resp, options); }
                    };
                    model.save(null, options);
                    return model;

                },
                 */

                /**
                 * Remove collection.
                 *
                 * @override
                 * @memberof Collection
                 * @param {Array|Object} models A Model list to delete
                 * @param {Object} options @see backbone.js#Collection.remove()
                 * @instance
                 */
                remove: function remove(models, options) {
                    // call Backbone.remove()
                    Collection.__super__.remove.apply(this, arguments);

                    models = _.isArray(models) ? models.slice() : [models];

                    _.each(models, function (m) {
                        m.dispose && m.dispose();
                    });

                    return this;
                },

                /**
                 * All the Model(s) are deleted.
                 *
                 * @memberof Collection
                 * @param {Array|Object} models A Model list to delete
                 * @param {Object} options @see backbone.js#Collection.remove()
                 * @instance
                 */
                removeAll: function removeAll(options) {
                    return this.remove(this.models, options);
                },

                /**
                 * @override
                 * @memberof Collection
                 * @instance
                 */
                _reset: function () {
                    this.length = 0;
                    _.each(this.models, function (m) {
                        m.dispose && m.dispose();
                    });
                    this.models = [];
                    this._byId  = {};
                },

                /**
                 * Binding exists
                 *
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isBinded: function isBinded() {
                    if (this._events) {
                        var i, l, name, names, list, events;
                        names = _.keys(this._events);
                        for (i = 0, l = names.length; i < l; i++) {
                            name = names[i];
                            list = this._events[name];
                            if (list && list.length > 0) {
                                return true;
                            }
                        }
                    }
                    return false;
                },

                /**
                 * Disposes of the instance
                 * Please use remove() to perform dispose.
                 *
                 * @memberof Collection
                 * @instance
                 */
                dispose: function dispose() {
                    logger.debug('Collection dispose');

                    _.each(this.models, function (m) {
                        m.dispose && m.dispose();
                    });

                    // delete this.urlRoot;
                    delete this.manager;
                    // delete this.url;
                    delete this.comparator;
                    delete this.length;
                    delete this.models;
                    delete this._byId;

                    // call Base.dispose()
                    // Collection.__super__.dispose.apply(this, arguments);
                }
            }
        );

        /**
         * @memberof Collection
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @see {beez}
         * @example
         * var MyCollection = Collection.extend(
         *     'myapp.MyCollection'
         *     {
         *         midx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        Collection.extend = beez.extendThis;

        return {
            Model: Model,
            Collection: Collection,
            ModelManager: ModelManager,
            ModelManagerAsync: ModelManagerAsync
            //manager: modelManager
        };

    });
})(this);

/**
 * @fileOverview BeezModic
 * @name modic.js<beez-mvcr>
 * @author Go Ohtani <otani_go@cyberagent.co.jp>
 */

(function (global) {

    /**
     * BeezModic module
     * @exports beez-mvcr/modic
     */
    define('beez-mvcr/modic',['require','exports','module','beez.core','underscore','backbone','beez-mvcr/model'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = require('underscore');
        var Backbone = require('backbone');

        var model = require('beez-mvcr/model');

        /**
         * Model without data source. (Logic Model)
         *
         * @constructor
         * @name Modic
         * @extends {beez.Modic}
         */
        var Modic = model.Model.extend(
            'beez.mvcr.Modic',
            /**
             * @lends module:beez-mvcr/model~Model.prototype
             */
            {

                /**
                 * Index for Model management.
                 *
                 * @memberof Modic
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,


                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 */
                lRoot: function urlRoot() {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 */
                url: function url() {
                    throw new beez.Error('not allowed to use this function.');
                },


                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 *
                 */
                async: function async() {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 */
                fetch: function fetch(options) {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 *
                 */
                save: function save(key, val, options) {
                    throw new beez.Error('not allowed to use this function.');
                }
            }
        );

        return {
            Modic: Modic
        };
    });
})(this);

/**
 * @fileOverview View
 * @name view.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {
    define('beez-mvcr/view',['require','exports','module','beez.core','underscore','backbone','beez-mvcr/base'],function __View__(require, exports, module) {
        

        var beez = require('beez.core');

        var _ = require('underscore');
        var Backbone = require('backbone');

        var base = require('beez-mvcr/base');
        var Base = base.Base;
        var ManagerBase = base.ManagerBase;

        var logger = beez.getLogger('beez.mvcr.view');


        /**
         * View management class, asynchronous
         *
         * @class
         * @name Creator
         * @extends {Bucks}
         */
        var ViewManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ViewManagerAsync',
            {
                initialize: function initialize(manager) {
                    this.manager = manager;
                },

                /**
                 * set root
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {View} root vidx is '@' must
                 * @return {ViewManagerAsync}
                 */
                root: function root(root) {
                    var self = this;
                    return this.then(function () {
                        return self.manager.root(root);
                    });
                },

                /**
                 * Generate View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {View|Array<View>} View Generate View object(s).
                 * @param {Object} [options] Argument of the View object.
                 * @return {ViewManagerAsync}
                 */
                create: function create(prefix, View, options) {
                    var self = this;
                    return this.then(function () {
                        var v =  self.manager.create(prefix, View, options);
                        var current = _.isArray(v) ? v[0] : v;
                        return current;
                    });
                },

                /**
                 * View is generated as a child of the View object generated before the chain.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {View|Array<View>} View Generate View object.
                 * @param {Object} [options] Argument of the View object.
                 * @return {ViewManagerAsync}
                 */
                child: function child(View, options) {
                    var self = this;
                    return this.then(function (current) {
                        var prefix = self.manager.pathOf(current);
                        var v = self.manager.create(prefix, View, options);
                        current = _.isArray(v) ? v[0] : v;
                        return current;
                    });
                },

                /**
                 * Get the parent View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @return {ViewManagerAsync}
                 */
                parent: function parent() {
                    var self = this;
                    return this.then(function (current) {
                        var parent = self.manager.getParent(current);
                        if (parent) {
                            throw new beez.Error('get parent failed. current: ' + current);
                        }
                        current = parent;
                        return current;
                    });
                },

                /**
                 * The child and its brother of the parents of View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {object} [options] Argument of the View object.
                 * @return {Creator}
                 */
                bro: function bro(brother, options) {
                    return this.parent().child(brother, options);
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ViewManagerAsync
                 * @override called when this chain ended
                 */
                dispose: function dispose() {
                    logger.debug('ViewManagerAsync dispose');
                    delete this.manager;
                    delete this.current;
                    delete this.root;
                }
            }
        );

        /**
         * ViewManager Class
         *
         * @class
         * @name ViewManager
         */
        var ViewManager = beez.extend(
            'beez.mvcr.ViewManager',
            ManagerBase,
            {

                /**
                 * Constructor
                 *
                 * @memberof ViewManager
                 * @instance
                 */
                initialize: function initialize() {
                    this.constructor.__super__.initialize.call(this, 'vidx');
                },

                /**
                 * Generating ViewManagerAsync
                 *
                 * @memberof ViewManager
                 * @instance
                 * @return {ViewManagerAsync}
                 */
                async: function async() {
                    return new ViewManagerAsync(this);
                },

                /**
                 * Set the Root View
                 *
                 * @memberof ViewManager
                 * @instance
                 * @param {View} RootView vidx is '@' must
                 * @return {View}
                 */
                root: function root(RootView) {
                    this.add('/', new function DummyRootView() { this.vidx = '@'; });
                    var rootView = new RootView(this);
                    var rootChildren = this.getChildren(this.get("/@")); // save
                    this.remove('/@');

                    var root = this.get('/@');
                    if (root) {
                        throw new beez.Error('root already exists!');
                    }

                    if (rootView.vidx !== '@') {
                        throw new beez.Error('roots vidx must be "@"');
                    }

                    this.add('/', rootView);

                    // re-save
                    for (var i = 0; i < rootChildren.length; i++) {
                        this.add('/@', rootChildren[i]);
                    }

                    return rootView;
                },


                /**
                 * Generate View.
                 *
                 * @memberof ViewManager
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {View|Array<View>} View Generate View object(s).
                 * @param {Object} [options] Argument of the View object.
                 * @return {Array}
                 */
                create: function create(prefix, View, options) {
                    if (!View || (!_.isArray(View) && typeof View !== 'function')) {
                        throw new beez.Error('View does not exist / does not be funciton. Specified prefix: ' + prefix);
                    }

                    if (!prefix) {
                        throw new beez.Error('No prefix specified. Creating:' + View.name);
                    }

                    if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + View.name);
                    }

                    if (!this.get(prefix)) { // no parent
                        throw new beez.Error('no parent exists. prefix: ' + prefix + ' ,  Please consider constructing view in Controller, or in #beforeOnce and so on.');
                    }


                    if (_.isArray(View)) {
                        return this._createArray(prefix, View, options);
                    }

                    return this._createObj(prefix, View, options);
                },

                /**
                 * Generate View(Object).
                 *
                 * @memberof ViewManager
                 * @instance
                 * @private
                 */
                _createObj: function _createObj(prefix, View, options) {
                    var v = new View(this, options);
                    if (!this.isAddable(v)) {
                        throw new beez.Error('index does not exists in the View. :' + v);
                    }
                    this.add(prefix, v);
                    return v;
                },


                /**
                 * Generate View(Array).
                 *
                 * @memberof ViewManager
                 * @instance
                 * @private
                 */
                _createArray: function _createArray(prefix, Views, options) {
                    var self = this;
                    // forced array
                    if (options && !_.isArray(options)) {
                        options = [options];
                    }

                    var instances = [];
                    _.each(Views, function (C, idx) {  // new
                        var params = options ? options[idx] : undefined;
                        var v = new C(self, params);
                        instances.push(v);
                    });

                    _.each(instances, function (view) { // check
                        if (!this.isAddable(view)) {
                            throw new beez.Error('index does not exists in the View. :' + view);
                        }
                    }, this);

                    this.add(prefix, instances);
                    return instances;
                },

                /**
                 * remove
                 *
                 * @name remove
                 * @memberof ViewManager
                 * @instance
                 * @param {String} path
                 */
                remove: function remove(path) {
                    ViewManager.__super__.remove.apply(this, arguments);
                },

                /**
                 * Dispose view and self from management.
                 *
                 * @memberof ViewManager
                 * @instance
                 */
                dispose: function dispose() {
                    var managedChildren = this.getChildrenAll(this.objs);

                    logger.debug('ViewManager dispose');

                    _.each(managedChildren, function (key) {
                        key.dispose();
                    });

                    ViewManager.__super__.dispose.apply(this, arguments);
                }
            }
        );

        // -------------------
        // View

        /**
         * View class Asynchronous
         *
         * @class
         * @name ViewAsync
         * @extends {Bucks}
         * @private
         */
        var ViewAsync = beez.Bucks.extend(
            'beez.mvcr.ViewAsync',
            {

                /**
                 * @memberof ViewAsync
                 * @param {View} root Root View
                 */
                initialize: function initialize(root) {
                    this._root = root;
                },

                /**
                 * Processing is performed by the flow of [beforeOnce -> before -> render -> after -> afterOnce].
                 *
                 * @memberof Renderer
                 * @instance
                 * @param {BeezView} view
                 * @param {boolen} [renderChildren=true]
                 */
                _render: function _render(view) {

                    // start with view
                    this.then(function () {
                        return view;
                    });

                    if (!view.state.isBeforeOnce) { // check flag
                        // call beforeOnce
                        this.then(function beforeOnce(view, next) {
                            if (!view.visible) {
                                logger.debug('view', view.vidx, 'is not visible. skip `beforeOnce`.');
                                next(null, view); // skip
                                return;
                            }

                            // if `beforeOnce` have `done` as a param
                            if (view.beforeOnce.length) {
                                view.beforeOnce(function wrappedDone() {
                                    view.state.isBeforeOnce = true;
                                    next(null, view);
                                });
                                return;
                            }

                            // else exec as sync
                            view.beforeOnce();
                            view.state.isBeforeOnce = true;
                            next(null, view);
                        });
                    }


                    // call before
                    this.then(function before(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `before`.');
                            next(null, view); // skip
                            return;
                        }

                        // if `before` have `done` as a param
                        if (view.before.length) {
                            view.before(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }
                        // else exec as sync
                        view.before();
                        next(null, view);

                    });


                    // call render
                    this.then(function render(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `render`.');
                            next(null, view); // skil
                            return;
                        }

                        // if `render` have `done` as a param
                        if (view.render.length) {
                            view.render(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }

                        // else exec as sync
                        view.render();
                        next(null, view);
                        return;
                    });

                    // call after
                    this.then(function after(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `after`.');
                            next(null, view); // skip
                            return;
                        }

                        // if `afterOnce` have `done` as a param
                        if (view.after.length) {
                            view.after(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }

                        // else exec as sync
                        view.after();
                        next(null, view);
                        return;
                    });

                    if (!view.state.isAfterOnce) { // check flag

                        // call afterOnce
                        this.then(function afterOnce(view, next) {
                            if (!view.visible) {
                                logger.debug('view', view.vidx, 'is not visible. skip `afterOnce`.');
                                next(null, view); // skip
                                return;
                            }

                            // if `afterOnce` have `done` as a param
                            if (view.afterOnce.length) {
                                view.afterOnce(function wrappedDone() {
                                    view.state.isAfterOnce = true;
                                    next(null, view);
                                });

                                return;
                            }

                            // else exec as sync
                            view.afterOnce();
                            view.state.isAfterOnce = true;
                            next(null, view);
                            return;
                        });
                    }

                    return this;
                },


                /**
                 * Delete the View.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @param {View} view
                 * @return {View}
                 */
                _remove: function _remove(view) {

                    return this.then(function () {
                        view.remove();
                        return view;
                    });
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * visible=false : Skip the rendering, including the child elements.
                 * showChildren=false : Only the specified view is rendered, child elements are not rendered.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @public
                 * @param {boolean} [showChildren=false] if not show children, set false
                 * @return {ViewAsync}
                 * @throws {beez.Error} render root is not set
                 */
                show: function show(showChildren) {
                    if (!this._root) {
                        throw new beez.Error('render root is not set. initialize renderer with root view parameter.');
                    }
                    return this._show(this._root, showChildren);
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * visible=false : Skip the rendering, including the child elements.
                 * showChildren=false : Only the specified view is rendered, child elements are not rendered.
                 *
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to show
                 * @param {boolean} [showChildren=false] if not show children, set false
                 * @return {ViewAsync}
                 */
                _show: function _show(view, showChildren) {

                    if (showChildren === undefined) {
                        showChildren = true;
                    }

                    var self = this;
                    if (!_.isArray(view)) {
                        logger.debug('showing', view.vidx);
                        this._render(view, showChildren); // case of single view
                    } else {
                        if (_.isEmpty(view)) { return this; }

                        // sort order property
                        view.sort(function (a, b) {
                            if (a.order < b.order) {
                                return -1;
                            }
                            if (a.order > b.order) {
                                return 1;
                            }

                            return 0;
                        });

                        // create render tasks
                        var tasks = _.map(
                            view,
                            function makeTask(v) {
                                return function task(err, res, next) {
                                    if (err) { throw err; }
                                    new ViewAsync()
                                        ._show(v, showChildren)
                                        .end(function (e, r) {
                                            next(e, undefined);
                                        });
                                };
                            }
                        );
                        this.waterfall(tasks);

                    }

                    if (showChildren) {
                        this.then(function renderC(view, next) {
                            if (!view) { return next(null, view); }

                            var children = view.getChildren();
                            if (_.isEmpty(children)) {
                                return next(null, view);
                            } else {
                                return new ViewAsync()
                                    ._show(children, showChildren)
                                    .end(next);
                            }
                        });
                    }

                    return this;
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * want to hide the View. And hide also to the child element
                 * hideChildren=false: Child element is not hidden.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to hide
                 * @param {boolean} [hideChildren=true] if set false, children not be removed
                 * @return {ViewAsync}
                 */
                hide: function hide(hideChildren) {
                    if (!this._root) {
                        throw new beez.Error('render root is not set. initialize renderer with root view parameter.');
                    }
                    return this._hide(this._root, hideChildren);
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * want to hide the View. And hide also to the child element
                 * hideChildren=false: Child element is not hidden.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to hide
                 * @param {boolean} [hideChildren=true] if set false, children not be removed
                 * @return {ViewAsync}
                 */
                _hide: function _hide(view, hideChildren) {

                    if (hideChildren === undefined) {
                        hideChildren = true;
                    }

                    var self = this;
                    if (!_.isArray(view)) { // case of single view
                        logger.debug('hiding', view.vidx);
                        this._remove(view);

                    } else { // create render tasks
                        var tasks = _.map(
                            view,
                            function makeTask(v) {
                                return function task(err, res, next) {
                                    if (err) { throw err; }
                                    new ViewAsync()
                                        ._hide(v, hideChildren)
                                        .end(function (err, ress) {
                                            next(err, undefined);
                                        });
                                };
                            }
                        );
                        this.waterfall(tasks);
                    }

                    if (hideChildren) {
                        this.then(function hideC(view, next) {
                            if (!view) { return next(null, view); }
                            var children = view.getChildren();
                            if (_.isEmpty(children)) {
                                return next(null, view);
                            } else {
                                return new ViewAsync()
                                    ._hide(children, hideChildren)
                                    .end(next);
                            }
                        });
                    }

                    return this;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof View
                 * @instance
                 */
                dispose: function dispopse() {
                    logger.debug('ViewAsync dispose');
                    delete this._root;
                }

            }
        );

        /**
         * View class
         *
         * @namespace beez.mvcr
         * @class
         * @name View
         * @extends {Backbone.View}
         * @see Backbone.View
         */
        var View = beez.extend(
            'beez.mvcr.View',
            Base,
            Backbone.View.prototype,
            {

                /**
                 * Constructor
                 *
                 * @memberof View
                 */
                constructor: function constructor() {
                    if (arguments.length < 1) {
                        throw new beez.Error('In order to create a View, requires one arguments.');
                    }
                    this.manager = arguments[0];

                    /**
                     * Management flag
                     * @memberof View
                     */
                    this.state = {
                        isBeforeOnce: false,
                        isAfterOnce: false
                    };

                    /**
                     * Skip rendering flag
                     *
                     * @memberof View
                     * @instance
                     * @property visible
                     * @type {boolean}
                     */
                    this.visible = true;

                    View.__super__.constructor.apply(this, Array.prototype.slice.call(arguments, 1));
                },

                /**
                 * call initialize method
                 *
                 * @memberof View
                 * @name initialize
                 * @override Backbone.View.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.View.initialize()
                    View.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for View management.
                 *
                 * @memberof View
                 * @instance
                 * @property vidx
                 */
                vidx: undefined, // View Index key

                /**
                 * HTMLElement
                 * @see Backbone#View
                 *
                 * @memberof View
                 * @instance
                 * @property el
                 */
                el: undefined,

                /**
                 * The order from the parent View
                 *
                 * @memberof View
                 * @instance
                 * @property order
                 */
                order: 0,

                /**
                 * The function performed before render is performed when a show function is performed. (only once)
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * beforeOnce: function beforeOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 *
                 */
                beforeOnce: beez.none,


                /**
                 * The function performed before render is performed when a show function is performed.
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * before: function before(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                before: beez.none,


                /**
                 * Execute after this view have been rendered.
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * after: function after(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                after: beez.none,


                /**
                 * Execute once after this view have been rendered.
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * afterOnce: function afterOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                afterOnce: beez.none,

                /**
                 * Generate async class
                 *
                 * @memberof View
                 * @instance
                 * @return {ViewAsync}
                 */
                async: function async() {
                    return new ViewAsync(this);
                },

                /**
                 * Return existence of HTMLElement on DOM tree in this view.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @return {boolean}
                 */
                isRendered: function isRendered() {
                    return !!this.el && !!this.el.parentElement;
                },

                /**
                 * set visible
                 *
                 * @memberof View
                 *
                 * @param {boolean} visible
                 * @throw {Error} typeof visible invalid. should be boolean
                 * @return {View} this
                 */
                setVisible: function setVisible(visible) {
                    if (typeof visible !== 'boolean') {
                        throw beez.Error('typeof visible invalid. should be boolean.');
                    }
                    this.visible = visible;
                    return this;
                },


                /**
                 * Disposes of the instance and remove HTMLElement
                 * and undelegate event on all view.
                 *
                 * @memberof View
                 * @instance
                 * @override Backbone.View.undelegateEvents
                 * @return
                 */
                dispose: function dispose() {
                    logger.debug('View dispose');

                    this.remove();

                    // call Backbone.undelegateEvents method
                    View.__super__.undelegateEvents.apply(this, arguments);

                    delete this.manager;
                    delete this.state;
                    delete this.visible;
                    delete this.cid;
                    delete this.options;
                    delete this.$el;
                    delete this.model;
                    delete this.collection;
                    delete this.el;
                    // delete this.id;
                    delete this.attributes;
                    delete this.className;
                    delete this.tagName;
                    // delete this.events;

                    // call Base.dispose()
                    // View.__super__.dispose.call(this);
                },
                /**
                 * Remove HTMLElement.
                 *
                 * @memberof View
                 * @function
                 * @override Backbone.View.remove
                 * @return
                 */
                remove: function remove() {
                    // call Backbone.remove
                    View.__super__.remove.apply(this, arguments);
                }
            }
        );


        /**
         * @memberof View
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @example
         * var MyView = View.extend(
         *     'myapp.MyView',
         *     {
         *         vidx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        View.extend = beez.extendThis;

        return {
            View: View,
            ViewAsync: ViewAsync,
            ViewManager: ViewManager,
            ViewManagerAsync: ViewManagerAsync
        };
    });
})(this);

/**
 * @fileOverview Controller/ControllerManager
 * @name controller.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define('beez-mvcr/controller',['require','exports','module','beez.core','beez.mvcr','beez.i18n','underscore'],function __Controller__(require, exports, module) {
        

        var beez = require('beez.core');
        require('beez.mvcr');
        require('beez.i18n');

        var logger = beez.getLogger('beez.mvcr.controller');

        var _ = require('underscore');

        // -------------------
        // ControllerManagerAsync

        /**
         * Controller management class, asynchronous
         *
         * @class
         * @name ControllerManagerAsync
         * @private
         * @param {ControllerManager} manager
         * @extends {Bucks}
         */
        var ControllerManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ControllerManagerAsync',
            {
                /**
                 * Constructor
                 *
                 * @memberof ControllerManagerAsync
                 * @instance
                 */
                initialize: function initialize(manager) {
                    this.manager = manager;
                },

                /**
                 * Generation of the Controller
                 *
                 * @memberof ControllerManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Controller|Array<Controller>} Controller Controller Object
                 * @param {Object|Array<Object>} [options] Arguments to the Controller
                 * @return {Controller}
                 */
                create: function create(name, Controller, options) {
                    var self = this;
                    return this.then(function createWrap(result, next) {

                        if (!Controller || typeof Controller !== 'function') {
                            throw new beez.Error('Controller does not exist / does not be funciton. Specified name: ' + name);
                        }
                        if (self.manager.controllers[name]) {
                            throw new beez.Error('It is a singleton in the module. name:' + name);
                        }

                        var controller = new Controller();
                        self.manager.controllers[name] = controller;
                        next(result, self.manager.controllers[name]);

                    }).then(function (controller, next) {
                        controller.loadCSS(function () { // initialize css load
                            next(null, controller);
                        });

                    }).then(function (controller, next) {
                        controller.loadI18n(function (err) { // initialize i18n load
                            if (err) {
                                logger.error('i18n load error. ', err.message);
                                logger.debug(err.stack);
                            }
                            next(err, controller);
                        });
                    });
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ControllerManagerAsync
                 */
                dispose: function dispose() {
                    logger.debug('ControllerManagerAsync dispose');
                    delete this.manager;
                }
            }
        );

        // -------------------
        // ControllerManager

        /**
         * Controller management class.
         *
         * @class
         * @name ControllerManager
         */
        var ControllerManager = beez.extend(
            'beez.mvcr.ControllerManager',
            function constructor() {
                return this.initialize();
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ControllerManager
                 * @instance
                 */
                initialize: function initialize() {
                    this.controllers = {};
                },

                /**
                 * Generating ControllerManagerAsync
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @return {ControllerAsync}
                 */
                async: function async() {
                    return new ControllerManagerAsync(this);
                },

                /**
                 * Remove controller
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @param {String} name jsonPath name
                 * @return {ControllerManager}
                 */
                remove: function remove(name) {
                    var obj = this.get(name);
                    if (!obj) {
                        return this;
                    }
                    delete this.controllers[name];
                    return this;
                },

                /**
                 * From path, acquire Controller.
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @param {String} name jsonPath name
                 * @return {Controller}
                 */
                get: function get(name) {
                    return this.controllers[name];
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ControllerManager
                 * @instance
                 */
                dispose: function () {
                    logger.debug("ControllerManager dispose");
                    delete this.controllers;
                }
            });


        // -------------------
        // Controller

        /**
         * Controller class.
         *
         * @namespace beez.mvcr
         * @class
         * @name Controller
         */
        var Controller = beez.extend(
            'beez.mvcr.Controller',
            function constructor() {
                this.initialize.apply(this, arguments);
            },
            {

                /**
                 * Constructor
                 *
                 * @memberof Controller
                 * @instance
                 */
                initialize: function initialize() {
                },

                /**
                 * automatic loading of i18n data.
                 * @memberof Controller
                 * @param {function} callback
                 */
                i18n: function i18n() {},

                /**
                 * automatic loading of i18n.
                 *
                 * @memberof Controller
                 * @param {function} callback Completion callback
                 * @instance
                 * @return {Controller}
                 */
                loadI18n: function loadI18n(callback) {
                    if (!beez.i18n) {
                        beez.createI18n();
                    }

                    var self = this;
                    if (beez.utils.is('Object', this.i18n)) { // dynamic load

                        var langs = [];
                        var paths = [];
                        _.each(this.i18n, function (path, lang) {
                            langs.push(lang);
                            paths.push(path);
                        });

                        require(paths, function () {
                            var list = Array.prototype.slice.call(arguments);
                            for (var i = 0; i < list.length; i++) {
                                var data = {};
                                data[langs[i]] = list[i];
                                beez.i18n.add(data);
                                logger.debug('i18n file loaded. path:', self.i18n[i]);
                            }
                            callback && callback(null);
                        }, function (err) {
                            callback && callback(err);
                        });

                    } else if (beez.utils.is('Function', this.i18n)) { // static load
                        new beez.Bucks()
                            .add(function (err, res, next) {
                                if (0 < self.i18n.length) {
                                    self.i18n(function (err, res) {
                                        next(err, res);
                                    });
                                } else {
                                    next(null, self.i18n());
                                }
                            })
                            .add(function (err, res) {
                                if (res) {
                                    beez.i18n.add(res);
                                }
                                callback && callback(err, res);
                            })
                            .end();

                    } else {
                        callback && callback(new Error('The Controller.i18n, please be defined in Function.'));
                    }
                    return this;

                },

                /**
                 * automatic loading of css.
                 *
                 * @memberof Controller
                 * @param {function} callback Completion callback
                 * @instance
                 * @return {Controller}
                 */
                loadCSS: function loadCSS(callback) {
                    var paths = this.css;
                    if (!paths || paths.length < 1) {
                        return callback && callback();
                    }

                    var self = this;
                    var tasks = _.map(paths, function task(p) {
                        return function t(err, res, next) {
                            beez.manager.css.async()
                                .load(p)
                                .end(function (err1, res1) {
                                    next(err, res1[0]);
                                }, function (err2) {
                                    next(err2);
                                });
                        };
                    });

                    var b = new beez.Bucks();
                    b.parallel(tasks)
                        .end(function (err, ress) {
                            callback && callback(err, ress);
                        });

                    return this;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof Controller
                 */
                dispose: function dispose() {
                    logger.debug("Controller dispose");
                    delete this.constructor.prototype.css;
                }
            }
        );


        /**
         * extend function
         *
         * @memberof Controller
         * @function
         * @param {String} [name] instance name
         * @param {Object} childProto prototypes
         * @borrows beez.extendThis as extend
         * @example
         * var MyController = Controller.extend(
         *     'myapp.MyController',
         *     {
         *         bar: function bar() {}
         *     }
         * );
         */
        Controller.extend = beez.extendThis;

        return {
            Controller: Controller,
            ControllerManager: ControllerManager,
            ControllerManagerAsync: ControllerManagerAsync
        };
    });
})(this);

/**
 * @fileOverview Router
 * @name router.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagnet.co.jp>
 */

(function (global) {
    define('beez-mvcr/router',['require','exports','module','beez.core','beez.mvcr','underscore','backbone'],function (require, exports, module) {
        

        var beez = require('beez.core');
        require('beez.mvcr');

        var logger = beez.getLogger('beez.mvcr.router');

        var _ = require('underscore');
        var Backbone = require('backbone');

        var __RouterManager__ = {


            initialize: function initialize() {

                /**
                 * Router instance (singleton)
                 *
                 * @memberof RouterManager
                 * @instance
                 */
                this.router = undefined;

                /**
                 * Router setup is complete
                 *
                 * @memberof RouterManager
                 * @instance
                 */
                this.setuped = false;
            },

            /**
             * router is initialized and routing is setuped.
             *
             * @memberof RouterManager
             * @instance
             * @param {Object} [options] overwrite merge the routes pass the set of routes
             * @param {beez.Router} [Router] Expanded Router instance.
             */
            setup: function setup(options, router) {
                var self = this;

                /* jshint loopfunc: true */
                if (this.setuped) {
                    throw new beez.Error('Already been executed once. If you want to add a route, please refer to the function add().');
                }

                var config = beez.config.router || {};
                var routes = _.extend(config, options); // merge

                logger.debug("router.setup", JSON.stringify(routes));

                if (this.router) {
                    return this;
                }

                // router extend or create
                this.router = router || new beez.Router();

                // register routes
                var names = _.keys(routes);
                for (var i = 0; i < names.length; i++) {
                    var key = names[i];
                    var data = routes[key];

                    logger.debug('router.route', key, JSON.stringify(data));

                    this.router.route(data.route, data.name, (function (name) {
                        function proxy() {
                            if (!routes.hasOwnProperty(name)) {
                                throw new beez.Error('route map key does not exist. name: ' + name);
                            }
                            var data = routes[name];
                            var parameter = arguments;

                            logger.debug("router.proxy", data);

                            // processing of controller before loading.
                            if (!beez.manager.c.get(data.xpath)) {
                                logger.debug("run controller firstBefore function. data:", data);
                                self.router.firstBefore(data);
                            }

                            require([data.require], function cnavigate(_Controller) {

                                logger.debug("controller.exec", data.xpath);
                                var controller = beez.manager.c.get(data.xpath);
                                if (controller) {
                                    if (!controller[data.name]) {
                                        throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                    }

                                    logger.debug("run controller before function. data:", data);
                                    self.router.before(data, _Controller); // run before function

                                    controller[data.name].apply(controller, parameter); // exec!!

                                    logger.debug("run controller after function. data:", data);
                                    self.router.after(data, _Controller); // run after function

                                } else {
                                    beez.manager.c.async().create(data.xpath, _Controller).then(function (controller) {
                                        if (!controller[data.name]) {
                                            throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                        }

                                        logger.debug("run controller before function. data:", data);
                                        self.router.before(data, _Controller); // run before function

                                        controller[data.name].apply(controller, parameter); // exec!!

                                        logger.debug("run controller after function. data:", data);
                                        self.router.after(data, _Controller); // run after function

                                    }).end();
                                }
                            });
                        }


                        return proxy;

                    })(key));
                }
                this.setuped = true;
            },


            /**
             * @see Backbone#Router.navigate
             *
             * @memberof RouterManager
             * @instance
             * @see Router
             */
            navigate: function navigate(fragment, options) {
                if (!this.setuped || !this.router) {
                    throw new beez.Error(
                        'Initialization has not been performed even once. Please do a "setup()".');
                }
                return this.router.navigate(fragment, options);
            }
        };

        /**
         * Routing management class.
         *
         * @class
         * @name RouterManager
         */
        var RouterManager = beez.extend(
            'beez.mvcr.RouterManager',
            function constructor() {
                return this.initialize();
            }, __RouterManager__);


        /**
         * Router Class (singleton)
         * @class
         * @name Router
         * @extends {Backbone.Router}
         * @see Backbone.Router
         */
        var Router = beez.extend(
            'beez.mvcr.Router',
            Backbone.Router,
            {

                /**
                 * @memberof Router
                 */
                constructor: function constructor() {
                    Router.__super__.constructor.apply(this, arguments);
                },

                /**
                 * Constructor
                 *
                 * @memberof Router
                 * @instance
                 */
                initialize: function initialize() {
                    Router.__super__.initialize.apply(this, arguments);
                },

                /**
                 * Interrupt processing of execution first before the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @instance
                 */
                firstBefore: function firstBefore(data) {},
                /**
                 * Interrupt processing of execution before the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @param {Controller} Controller Controller class of target
                 * @instance
                 */
                before: function before(data, Controller) {},

                /**
                 * Interrupt processing of execution after the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @param {Controller} Controller Controller class of target
                 * @instance
                 */
                after: function after(data, Controller) {}
            }
        );


        return {
            Router: Router,
            RouterManager: RouterManager
        };
    });
})(this);

/**
 * @fileOverview CSSManager
 * @name cssmanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define('beez-mvcr/cssmanager',['require','exports','module','beez.core','underscore','zepto'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var logger = beez.getLogger('beez.mvcr.cssmanager');

        var _ = require('underscore');
        var $ = require('zepto');

        // -------------------
        // functions

        /**
         * @see CSSManager.isExists
         */
        var isExists = function isExists(path) {
            var stylesheets = document.styleSheets;
            var found = _.find(stylesheets, function (sheet) {
                var href = sheet.href;
                return (href && href.indexOf(path) !== -1);
            });
            return found && found.rules && found.rules.length > 0;
        };

        /**
         * @see CSSManager.isLoaded
         */
        var isLoaded = function isLoaded(path) {
            var stylesheets = document.styleSheets;

            var found = _.find(stylesheets, function (sheet) {
                var href = sheet.href;
                return (href && href.indexOf(path) !== -1);
            });
            return !!found;
        };

        // -------------------
        // CSSManagerAsync

        /**
         * Load the CSS with the given path, and then run the callback in the timing that have been added to the document.styleSheets. (asynchronous)
         *
         * @class
         * @name CSSManagerAsync
         * @private
         * @param {CSSManager} manager
         * @extends {Bucks}
         *
         * @example
         * var async = new CSSManagerAsync('/index.css');
         * async.then(function() {
         *     // succesfully loaded
         * }).error(function err() {
         *     // error on loading
         * }).end();
         *
         */
        var CSSManagerAsync = beez.Bucks.extend(
            'beez.mvcr.CSSManagerAsync',
            {

                initialize: function initialize(manager) {
                    this.manager = manager;
                    this._path = '';
                    this._intervalId = undefined;
                    this._timeoutId = undefined;

                    // load-checking interval
                    this.INTERVAL = (
                        (beez.config.manager &&
                         beez.config.manager.css &&
                         beez.config.manager.css.interval) || 1000 / 20
                    );

                    // load-timeout
                    this.TIMEOUT = (
                        (beez.config.manager &&
                         beez.config.manager.css &&
                         beez.config.manager.css.timeout) || 1000 * 10
                    );
                },

                /**
                 * CSS is loaded.
                 * Warnnig: The present condition and the unific method of detecting HTTP Response Code (404, ...) are not found.
                 * When http or https is in a head, it loads by name directly.
                 *
                 * @memberof CSSManagerAsync
                 * @instance
                 * @asynchronous
                 *
                 * @example
                 * CSSManager.load('/index.css')
                 * .error(function onError() {
                 * // timeout etc
                 * })
                 * .then(function then() {
                 * })
                 * .end();
                 */
                load: function load(name) {
                    var self = this;

                    var path = this._path = name;
                    if (!name.match(/^(http|https):\/\/.+$/)) {
                        path = this._path = this.manager.name2path(name);
                    }

                    if (!path) {
                        return this.empty(); // ignore
                    }

                    if (this.manager.isLoaded(path)) {

                        logger.debug('path: ' + path + ' already exists');
                        path = undefined;
                        return this.empty(); // ignore
                    }

                    // insert link tag for stylesheet
                    var linkstyleTag = '<link rel="stylesheet" href="' + _.escape(path) + '" ></link>';
                    $('head').append(linkstyleTag);

                    return this.then(function loadWrap(res, next) {

                        self._intervalId = setInterval(function () { // TODO: utils#timer replace
                            if (isLoaded(path)) { //stylesheetが存在
                                self.abort(); //ruleが存在
                                logger.debug('load finished. path: ' + path);
                                next();
                            }
                        }, self.INTERVAL);

                        self._timeoutId = setTimeout(function () { // TODO: utils#timer replace
                            self.abort();
                            next(new beez.Error('loading timed out. path:' + path));
                        }, self.TIMEOUT);
                    });
                },

                /**
                 * remove the link tag in the path contained in the name.
                 *
                 * @asynchronous
                 * @memberof CSSManagerAsync
                 * @insntace
                 *c @param {String} name
                 */
                remove: function remove(name) {
                    var self = this;
                    return this.then(function remove() {
                        return self.manager.remove(name);
                    });
                },

                /**
                 * Cancel the monitor.
                 *
                 * @instance
                 * @memberof CSSManagerAsync
                 */
                abort: function abort() {
                    clearTimeout(this._timeoutId);
                    clearInterval(this._intervalId);
                    delete this._timeoutId;
                    delete this._intervalId;
                    delete this.INTERVAL;
                    delete this.TIMEOUT;
                },

                /**
                 * Disposes of the instance
                 *
                 * @instance
                 * @memberof CSSManagerAsync
                 */
                dispose: function dispose() {
                    logger.debug('CSSManagerAsync dispose');
                    delete this.manager;
                    delete this._path;
                    this.abort();
                }
            }
        );

        // -------------------
        // CSSManager

        /**
         * Load the CSS with the given path, and then run the callback in the timing that have been added to the document.styleSheets. (asynchronous)
         *
         * @class
         * @name CSSManager
         */
        var CSSManager = beez.extend(
            'beez.mvcr.CSSManager',
            function constructor() {
                return this.initialize();
            },
            {

                initialize: function initialize() {
                    this._basePath = ''; // Force / in the end

                    if (beez.config.url && beez.config.url.base) {
                        this._basePath = beez.config.url.base;
                        this._basePath.replace(/\/$/, '');
                    }

                },

                /**
                 * name is changed into path.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @param {String} name
                 * @return {String}
                 */
                name2path: function name2path(name) {
                    var path = '';
                    if (!this._basePath) {
                        path = name;
                    } else {
                        if (name.indexOf('/') === 0) {
                            path = this._basePath + name;
                        } else {
                            path = this._basePath + '/' + name;
                        }
                    }
                    return path;
                },

                /**
                 * Asynchronous instance generation.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @return {CSSManagerAsync}
                 */
                async: function async() {
                    return new CSSManagerAsync(this);
                },

                /**
                 * remove the link tag in the path contained in the name.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @param {String} name
                 */
                remove: function remove(name) {
                    var $stylelinks = $('link[rel=stylesheet]');
                    $stylelinks.each(function () {
                        if (this.href.indexOf(name) !== -1) {
                            logger.debug('remove finished. name:', name, ', path: ' + this.href);
                            $(this).remove();
                        }
                    });
                    return this;
                },

                /**
                 * Check css path specified in the present.
                 *
                 * @memberof CSSManager
                 * @instance
                 * @param {String} path
                 * @return {boolean}
                 */
                isExists: isExists,

                /**
                 * CSS is loaded?
                 * Warnnig: Relative paths are not expected.
                 *
                 * @memberof CSSManager
                 * @instance
                 * @param {String} path
                 * @return {boolean}
                 */
                isLoaded: isLoaded,

                /**
                 * Disposes of the instance
                 *  @memberof CSSManager
                 */
                dispose: function dispose() {
                    logger.debug('CSSManager dispose');
                    delete this._basePath;
                }
            }
        );

        // -------------------
        // return

        return {
            CSSManager: CSSManager,
            CSSManagerAsync: CSSManagerAsync
        };
    });

})(this);

/**
 * @fileOverview CSSManager
 * @name imagemanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * @overview image management functions
 */

(function (global) {

    define('beez-mvcr/imagemanager',['require','exports','module','beez.core','beez.utils','underscore','zepto'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var utils = require('beez.utils');
        var _ = require('underscore');
        var $ = require('zepto');

        var logger = beez.getLogger('beez.mvcr.imagemanager');

        /**
         * transparent-1px image data
         * @type {String}
         */
        var transparentImageDataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAA1JREFUeNoBAgD9/wAAAAIAAVMrnDAAAAAASUVORK5CYII=';

        var _uid = 0;
        var uid = function uid() {
            return '__beez_manager_image_uid_' + _uid++;
        };

        /**
         * Class that manages multiple Image Object. re-use function of <img>.
         *
         * @class
         * @name ImangePool
         * @private
         * @param {int} size Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
         * @throw {Error}
         */
        var ImangePool = beez.extend(
            'beez.mvcr.ImagePool',
            function constructor(size, options) {
                return this.initialize(size, options);
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ImangePool
                 * @instance
                 * @param {int} size Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
                 * @param {Object} options for creating image
                 */
                initialize: function initialize(size, options) {
                    /**
                     * for creating image
                     *
                     * @memberof ImangePool
                     * @instance
                     * @property {Object} options
                     */
                    this.options = options || {};

                    /**
                     * pool limit
                     *
                     * @memberof ImangePool
                     * @instance
                     * @property {int} limit
                     */
                    this.limit = size;

                    /**
                     * The total number of generated HTMLImageElement
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._total = 0;

                    /**
                     * HTMLImageElement total number in use.
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._num_used = 0;

                    /**
                     * HTMLImageElement hash in use.
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._using = {};

                    /**
                     * Waiting for reuse HTMLImageElement
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     * @return {Array}
                     */
                    this._unused = [];
                },


                /**
                 * Generate HTMLImageElement.
                 *
                 * It is returned when there is recyclable HTMLImageElement.
                 * release() is given to HTMLImageElement.
                 * Please call release () to always While destroying HTMLImageElement.
                 *
                 * @memberof ImangePool
                 * @instance
                 * @param {Object} options for creating image
                 * @return {HTMLImageElement}
                 */
                create: function create(options) {
                    var elem;
                    //options = options || this.options || {}; // default) not "Anonymous"
                    options = options || {}; // default) not "Anonymous"

                    if (this._unused.length > 0) {
                        elem = this._unused.pop();
                    } else {
                        if (this.limit > 0 && this._total >= this.limit) {
                            throw new beez.Error('image pool limit exceeds!');
                        }
                        elem = new Image();
                        elem.__beez_manager_image_uid = uid();
                        this._total++;
                    }

                    //elem.crossOrigin = options.crossOrigin ? options.crossOrigin : elem.crossOrigin;
                    //elem.crossOrigin = options.crossOrigin ? options.crossOrigin : options.crossOrigin;

                    if (options.crossOrigin) {
                        elem.crossOrigin = options.crossOrigin;
                    } else if (this.options.crossOrigin) {
                        elem.crossOrigin = this.options.crossOrigin;
                    }

                    this._num_used++;
                    this._using[elem.__beez_manager_image_uid] = elem;

                    var self = this;

                    /**
                     * The HTMLImageelement waiting for reuse.
                     * This function will be removed in the release() timing.
                     */
                    elem.release = function release() {
                        this.crossOrigin = null; // force null!!
                        this.src = transparentImageDataURI;
                        self._using && delete self._using[this.__beez_manager_image_uid];
                        self._unused && self._unused.push(this);
                        self._num_used && self._num_used--;
                        delete this.release;
                    };

                    return elem;
                },


                /**
                 * It is the number of HTMLImageElement(s) during use.
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                living: function living() {
                    return this._num_used;
                },


                /**
                 * The total number of HTMLImageElement
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                peak: function peak() {
                    return this._total;
                },


                /**
                 * Waiting for reuse of HTMLImageElement
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                waiting: function waiting() {
                    return this._unused.length;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ImangePool
                 */
                dispose: function dispose() {
                    logger.debug('ImangePool dispose');
                    // release all of using images
                    for (var id in this._using) {
                        this._using[id].release();
                    }
                    delete this._using;

                    while (this._unused.length > 0) {
                        var e = this._unused.pop();
                        delete e.__beez_manager_image_uid;
                    }
                    delete this._unused;

                    delete this._num_used;
                    delete this._total;
                    delete this._limit;
                }
            }
        );



        /**
         * Image management class. asynchronous
         *
         * @class
         * @name ImageManagerAsync
         * @private
         * @extends Bucks
         * @example
         * var l = new ImageManagerAsync();
         * l.load('http://...').then(res, next) {
         *     // res[0] is loaded image
         * }).end();
         */
        var ImageManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ImageManagerAsync',
            {
                /**
                 * Constructor
                 * @memberof ImageManagerAsync
                 */
                initialize: function initialize(imageManager) {
                    this.imageManager = imageManager;
                },

                /**
                 * Load the image.
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @param {String} url
                 * @param {Object} options for creating image
                 * @return {Bucks}
                 * @example
                 * loader.loadOne('http://...').then(function onload(res, next) {
                 *     // res is a loaded-image
                 *     // next(null, ...)
                 * }).error(function onError(err, next) {
                 *     // on error
                 * }).end();
                 */
                loadOne: function loadOne(url, options) {

                    var img = this.imageManager.create(options);
                    var self = this;

                    return this.add(function loadTask(err, res, next) {

                        var $img = $(img);

                        var onLoad = function onLoad() {
                            $img.off();
                            next(null, img);
                        };
                        var onError = function onError(ev) {
                            var src = img.src;

                            $img.off();
                            img.release();
                            next(new beez.Error('error on load image. src:' + src));
                        };
                        var onAbort = function onAbort(ev) {
                            var src = img.src;

                            $img.off();
                            img.release();
                            next(new beez.Error('image loading aborted. src:' + src));
                        };

                        $img.on('load', onLoad);
                        $img.on('error', onError);
                        $img.on('abort', onAbort);

                        // start loading
                        var _url = self.imageManager.imageUrl(url); // replace ${ratio}
                        img.src = _url;
                    });
                },

                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @param {String|Array} url ex) Array: ['hoge.png', 'foo.png']
                 * @param {Object|Array} options ex) Array: [{crossOrigin: "Anonymous"}, {crossOrigin: ""}]
                 * @return {Bucks} ex.) {res:[HTMLImageElement, null, null, HTMLImageElement], err:[null, Error, Error, HTMLImageElement]}
                 */
                load: function load(url, options) {

                    // param check and Array-nize
                    if (_.isString(url)) {
                        url = [url];
                    } else if (!_.isArray(url)) {
                        throw new beez.Error('url can be String or Array of string.');
                    }

                    // param check and Array-nize

                    options = options || {};
                    if (!_.isArray(options)) {
                        if (_.isObject(options)) {
                            options = [options];
                        } else {
                            throw new beez.Error('options can be Object or Array of object.');
                        }
                    }

                    // make tasks
                    var self = this;
                    var tasks = _.map(url, function makeTask(u, idx) {
                        return function loadTask(err, res, next) {
                            new ImageManagerAsync(self.imageManager)
                                .loadOne(u, options[idx])
                                .end(function complete(err, res) {
                                    next(err, res[0]);
                                }, function onError(e) {
                                    next(e);
                                });
                        };
                    });

                    // parallel load
                    return this.parallel(tasks);
                },

                /**
                 * dispose this ImageManagerAsync
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @private
                 */
                dispose: function dispose() {
                    delete this.imageManager;
                }
            }
        );



        /**
         * Image management class. synchronism
         *
         * @class
         * @name ImageManager
         * @param {Object} [options]
         * @param {int} [options.size] Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
         */
        var ImageManager = beez.extend(
            'beez.mvcr.ImageManager',
            function constructor(options) {
                return this.initialize(options);
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ImageManager
                 * @param {Object} options for creating image
                 * @example
                 * var options = {
                 *     size: 10,
                 *     pool: {
                 *         crossOrigin: 'Anonymous'
                 *     }
                 * };
                 *     var manager = new ImageManager(options);
                 *
                 *
                 */
                initialize: function initialize(options) {
                    var size = (options && options.size) ? options.size : 0;
                    var pool = (options && options.pool) ? options.pool : {};
                    this.pool = new ImangePool(size, pool);
                },

                /**
                 * Replaced by pixcelRatio of the URL $ {ratio}
                 *
                 * @memberof ImageManager
                 */
                imageUrl: function imageUrl(url) {
                    return url.replace('${ratio}', beez.utils.pixelRatio * 10);
                },

                /**
                 * Generate HTMLImageElement.
                 *
                 * It is returned when there is recyclable HTMLImageElement.
                 * release() is given to HTMLImageElement.
                 * Please call release () to always While destroying HTMLImageElement.
                 *
                 * @memberof ImageManager
                 * @param {Object} options for creating image
                 * @instance
                 */
                create: function create(options) {
                    return this.pool.create(options);
                },


                /**
                 * It is the number of HTMLImageElement(s) during use.
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                living: function living() {
                    return this.pool.living();
                },


                /**
                 * The total number of HTMLImageElement
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                peak: function peak() {
                    return this.pool.peak();
                },


                /**
                 * Waiting for reuse of HTMLImageElement
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                waiting: function waiting() {
                    return this.pool.waiting();
                },


                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManager
                 * @instance
                 * @param {String|Array} url
                 * @param {Object|Array} options ex) Array: [{crossOrigin: "Anonymous"}, {crossOrigin: ""}]
                 * @return {ImageManagerAsync}
                 * @see ImageManagerAsync#load
                 */
                load: function load(url, options) {
                    return new ImageManagerAsync(this).load(url, options);
                },


                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManager
                 * @instance
                 * @param {String} url
                 * @param {Object} options
                 * @return {ImageManagerAsync}
                 * @see ImageManagerAsync#loadOne
                 */
                loadOne: function loadOne(url, options) {
                    return new ImageManagerAsync(this).loadOne(url, options);
                },

                /**
                 * dispose this ImageManagerAsync
                 *
                 * @memberof ImageManager
                 * @instance
                 * @private
                 */
                dispose: function dispose() {
                    logger.debug('ImageManagerAsync dispose');
                    this.pool.dispose();
                    delete this.pool;
                }
            }
        );

        return {
            ImageManager: ImageManager,
            ImageManagerAsync: ImageManagerAsync
        };
    });
})(this);

/**
 * @fileOverview beez.mvcr class
 * @name index.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    /**
     * mvcr namespace
     * @namespace beez.mvcr
     */
    define('beez.mvcr',['require','exports','module','beez.core','handlebars','beez-mvcr/model','beez-mvcr/modic','beez-mvcr/view','beez-mvcr/controller','beez-mvcr/router','beez-mvcr/cssmanager','beez-mvcr/imagemanager','beez-mvcr/base','backbone','beez-mvcr/model','beez-mvcr/view','beez-mvcr/controller','beez-mvcr/router','beez-mvcr/cssmanager','beez-mvcr/imagemanager'],function __MVCR__(require, exports, module) {
        

        var beez = require('beez.core');
        var logger = beez.getLogger('beez.mvcr');

        if (beez.mvcr) {
            logger.debug('beez.mvcr already defined.');
            return beez.mvcr;
        }

        var Handlebars = require('handlebars');

        /**
         * Shortcut function
         *   Handlebars.templates[]
         * @memberof beez
         * @function
         * @name getTemplate
         * @param {String} name
         * @returns {Function} handlebars template function
         */
        beez.getTemplate = function getTemplate(name) {
            return Handlebars.templates[name];
        };

        var __MVCR__ = {
            initialize: function () {

                var model = require('beez-mvcr/model');
                var modic = require('beez-mvcr/modic');
                var view = require('beez-mvcr/view');
                var controller = require('beez-mvcr/controller');
                var router = require('beez-mvcr/router');
                var css = require('beez-mvcr/cssmanager');
                var image = require('beez-mvcr/imagemanager');
                var base = require('beez-mvcr/base');


                /**
                 * @name Model
                 * @memberof beez.mvcr
                 * @borrows Model
                 * @type {Model}
                 */
                this.Model = model.Model;

                /**
                 * @name ModelManager
                 * @memberof beez.mvcr
                 * @borrows ModelManager
                 * @type {ModelManager}
                 */
                this.ModelManager = model.ModelManager; // if you want to extend

                /**
                 * @name ModelManagerAsync
                 * @memberof beez.mvcr
                 * @borrows ModelManagerAsync
                 * @type {ModelManagerAsync}
                 */
                this.ModelManagerAsync = model.ModelManagerAsync; // if you want to extend

                /**
                 * @name Collection
                 * @memberof beez.mvcr
                 * @borrows Collection
                 * @type {Collection}
                 */
                this.Collection = model.Collection;

                /**
                 * @name Modic
                 * @memberof beez.mvcr
                 * @borrows Modic
                 * @type {Modic}
                 */
                this.Modic = modic.Modic;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows View
                 * @type {View}
                 */
                this.View = view.View;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewAsync
                 * @type {ViewAsync}
                 */
                this.ViewAsync = view.ViewAsync;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewManager
                 * @type {View}
                 */
                this.ViewManager = view.ViewManager; // if you want to extend

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewManagerAsync
                 * @type {ViewManagerAsync}
                 */
                this.ViewManagerAsync = view.ViewManagerAsync; // if you want to extend


                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows Controller
                 * @type {Controller}
                 */
                this.Controller = controller.Controller;

                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows ControllerManager
                 * @type {Controller}
                 */
                this.ControllerManager = controller.ControllerManager; // if you want to extend

                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows ControllerManagerAsync
                 * @type {ControllerAsync}
                 */
                this.ControllerManagerAsync = controller.ControllerManagerAsync; // if you want to extend

                /**
                 * @name Router
                 * @memberof beez.mvcr
                 * @borrows Router
                 * @type {Router}
                 */
                this.Router = router.Router;

                /**
                 * @name RouterManager
                 * @memberof beez.mvcr
                 * @borrows RouterManager
                 * @type {RouterManager}
                 */
                this.RouterManager = router.RouterManager; // if you want to extend

                /**
                 * @name CSSManager
                 * @memberof beez.mvcr
                 * @borrows CSSManager
                 * @type {CSSManager}
                 */
                this.CSSManager = css.CSSManager;     // if you want to extend
                /**
                 * @name CSSManagerAsync
                 * @memberof beez.mvcr
                 * @borrows CSSManagerAsync
                 * @type {CSSManagerAsync}
                 */
                this.CSSManagerAsync = css.CSSManagerAsync;     // if you want to extend
                /**
                 * @name ImageManager
                 * @memberof beez.mvcr
                 * @borrows ImageManager
                 * @type {ImageManager}
                 */
                this.ImageManager = image.ImageManager; // if you want to extend
                /**
                 * @name ImageManagerAsync
                 * @memberof beez.mvcr
                 * @borrows ImageManagerAsync
                 * @type {ImageManagerAsync}
                 */
                this.ImageManagerAsync = image.ImageManagerAsync; // if you want to extend
                /**
                 * @name ManagerBase
                 * @memberof beez.mvcr
                 * @borrows ManagerBase
                 * @type {ManagerBase}
                 */
                this.ManagerBase = base.ManagerBase;
                /**
                 * @name Base
                 * @memberof beez.mvcr
                 * @borrows Base
                 * @type {Base}
                 */
                this.Base = base.Base;

            }
        };

        var MVCR = beez.extend(
            'beez.MVCR',
            function constructor() {
                return this.initialize();
            }, __MVCR__);

        var mvcr = new MVCR();


        // Add to beez object.
        beez.mvcr = mvcr;

        beez.Model = mvcr.Model;
        beez.Collection = mvcr.Collection;
        beez.Modic = mvcr.Modic;
        beez.View = mvcr.View;
        beez.Controller = mvcr.Controller;
        beez.Router = mvcr.Router;

        // Backbone shortcut
        var Backbone = require('backbone');
        /**
         * Backbone.history short cut.
         * @name history
         * @memberof beez
         */
        beez.history = Backbone.history;

        //
        // ----
        // Managers
        //

        var mconfig = beez.config.manager || {};

        var __Manager__ = {
            initialize: function () {
                /**
                 * setuped flag
                 * @memberof beez.manager
                 * @name setuped
                 * @type {Boolean}
                 */
                this.setuped = false;

                /**
                 * ModelManager instance
                 * @memberof beez.manager
                 * @name model
                 * @alias m
                 * @type {ModelManager}
                 */
                this.model = undefined;

                /**
                 * shortcut for model
                 * @memberof beez.manager
                 * @name m
                 * @type {ModelManager}
                 */
                this.m = undefined;

                /**
                 * ViewManager instance
                 * @memberof beez.manager
                 * @name view
                 * @type {ViewManager}
                 */
                this.view = undefined;

                /**
                 * shortcut for view
                 * @memberof beez.manager
                 * @name v
                 * @type {ViewManager}
                 */
                this.v = undefined;

                /**
                 * ControllerManager instance
                 * @memberof beez.manager
                 * @name controller
                 * @type {ControllerManager}
                 */
                this.controller = undefined;

                /**
                 * shortcut for controller
                 * @memberof beez.manager
                 * @name c
                 * @type {ControllerManager}
                 */
                this.c = undefined;

                /**
                 * RouterManager instance
                 * @memberof beez.manager
                 * @name router
                 * @type {RouterManager}
                 */
                this.router = undefined;

                /**
                 * shortcut for router
                 * @memberof beez.manager
                 * @name r
                 * @type {RouterManager}
                 */
                this.r = undefined;

                /**
                 * CSSManager instance
                 * @memberof beez.manager
                 * @name css
                 * @type {CSSManager}
                 */
                this.css = undefined;

                /**
                 * ImageManager instance
                 * @memberof beez.manager
                 * @name image
                 * @type {ImageManager}
                 */
                this.image = undefined;
            },

            /**
             * Beez MVCR Manager Setup
             *
             * @memberof MVCR
             * @instance
             * @public
             * @param {Object} objs It sets up to overwrite a management class.
             * @return {MVCR}
             */
            setup: function setup(objs) {
                if (this.setuped) {
                    return this;
                }

                objs = objs || {};
                this.setuped = true;

                // Initialize ModelManager
                if (objs.model) {
                    this.model = objs.model;
                } else {
                    var model = require('beez-mvcr/model');
                    this.model = new model.ModelManager('midx');
                }
                this.m = this.model; // shortcut


                // Initialize ViewManager
                if (objs.view) {
                    this.view = objs.view;
                } else {
                    var view = require('beez-mvcr/view');
                    this.view = new view.ViewManager('vidx');
                }
                this.v = this.view; // shortcut

                // Initialize ControllerManager
                if (objs.controller) {
                    this.controller = objs.controller;
                } else {
                    var controller = require('beez-mvcr/controller');
                    this.controller = new controller.ControllerManager();
                }
                this.c = this.controller; // shortcut


                // Initialize RouterManager
                if (objs.router) {
                    this.router = objs.router;
                } else {
                    var router = require('beez-mvcr/router');
                    this.router = new router.RouterManager();
                }
                this.r = this.router; // shortcut

                // Initialize CSSManager
                if (objs.css) {
                    this.css = objs.css;
                } else {
                    var css = require('beez-mvcr/cssmanager');
                    this.css = new css.CSSManager();
                }

                // Initialize ImageManager
                if (objs.image) {
                    this.image = objs.image;
                } else {
                    var image = require('beez-mvcr/imagemanager');
                    this.image = new image.ImageManager(mconfig.image);
                }
                return this;
            }
        };

        var Manager = beez.extend(
            'beez.Manager',
            function constructor() {
                return this.initialize();
            }, __Manager__);

        var manager = new Manager();
        mvcr.manager = manager;
        beez.manager = mvcr.manager; // shortcut

        return beez.mvcr;
    });
})(this);

/** @license MIT License (c) 2012-2013 Cyberagent Inc. */
/**
 * @name index.js<beez>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview beez entrypoint
 */

var VERSION = '0.9.9';

if (typeof module !== 'undefined' && module.exports) { // node.js: main
    exports.VERSION = VERSION;
} else {
    VERSION = VERSION;

    (function (global) {

        /**
         * beez namespace
         * @namespace beez
         * @exports beez
         */
        define('beez',['require','exports','module','beez.core','beez.mvcr','beez.utils','underscore','zepto','backbone','handlebars'],function (require, exports, module) {
            

            var beez = require('beez.core');
            var mvcr = require('beez.mvcr');
            var utils = require('beez.utils');

            var vendor = {
                _:  require('underscore'),
                $: require('zepto'),
                Backbone: require('backbone'),
                Handlebars: require('handlebars')
            };

            beez.vendor = vendor;
            beez.VERSION = VERSION;

            return beez;
        });

    })(this);
}
;