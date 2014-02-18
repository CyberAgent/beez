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
    define('beez.core',['require','exports','module','beez-core/suns','beez-core/error','beez-core/bucks','beez-core/logcafe','backbone','handlebars'],function (require, exports, module) {
        

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
                    logger.debug('Set the value to the global scope.', key, ':', global[key]);
                }
            }
        }

        var beez = {

            /**
             * Reference of dependent libraries
             *
             * <ul>
             * <li>_ : underscore or lo-dash ... http://underscorejs.org/
             * <li>$ : zepto or jquery ... http://zeptojs.com/
             * <li>Backbone : Backbone.js http://backbonejs.org/
             * <li>Handlebars : Handlebars.js http://handlebarsjs.com/
             * </ul>
             *
             * @member vendor
             * @type {Object}
             */
            vendor: {},

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

        beez.vendor._ = beez.root._;

        beez.vendor.$ = beez.root.$;

        beez.vendor.Backbone = require('backbone');

        beez.vendor.Handlebars = require('handlebars');

        /**
         * window.beez
         * @global
         */
        root.beez = beez;

        return beez;
    });
})(this);

