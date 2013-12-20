/**
 * @name browser.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview get browser info
 */

(function (global) {

    define(function (require, exports, module) {
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
