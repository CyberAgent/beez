/**
 * @name bucks.js
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview Async chain utility for node and the browser. (amd support)
 */

(function (global) {
    'use strict';

    // no-op function
    var none = function none() {};


    /**
     * 配列かどうかを返します
     * @function
     * @private
     * @param {Object} obj
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
        this._interrupt = false;
        this.__id = uid();
        Bucks.living[this.__id] = this;
        this.initialize(params);
    };

    /**
     * bucks.js version
     * @memberof Bucks
     * @static
     */
    Bucks.VERSION = '0.8.4';

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
         * @return {functio} task(err, res, next)
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
         * @return {function} wrappedTask onSuccess(res, next)
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
         * @return {function} wrappedTask ex) onError(err, next)
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
         * @param {Object} res previous result
         * @return {Bucks}
         */
        _iterator: function _iterator(err, res) {

            if (this._interrupt) {
                return this;
            }

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

        interrupt: function interrupt() {
            this._interrupt = true;
            this.destroy();

            return this;
        },


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

                // @TODO: excluded from the deleted
                // delete this._interrupt;

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
         * @param {function} [callback] 最終コールバック関数 ressは各チェインの実行結果の配列 ex) callback(err, res)
         * @param {function} [errback] callbackでエラーが発生した場合のハンドラ ex) errback(err)
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
     * @property {} resultObj {err:[], res:[]}の形式
     */
    ParallelHandler.prototype.__defineGetter__('resultObj', function resultObj() {
        return {err: this._errors, res: this._results};
    });


    if (typeof define === 'function' && define.amd) {
        // requirejs
        define(function (require, exports, module) {
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
