/**
 * @name browser.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview get browser info
 */

(function (global) {

    define('beez-utils/browser',['require','exports','module','beez.core','backbone','beez.ua'],function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var global = beez.global || global;

        var _ = beez.vendor._;
        var $ = beez.vendor.$;

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
        'use strict';
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
    define('beez-utils/timer',['require','exports','module','beez.core','beez-utils/uid'],function (require, exports, module) {
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
    define('beez.utils',['require','exports','module','beez.core','beez-utils/browser','beez-utils/timer'],function (require, module, exports) {
        'use strict';

        var beez = require('beez.core');
        var _ = beez.vendor._;

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

