/**
 * @name timer.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview timers
 */

(function (global) {
    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var _ = beez.vendor._;
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
