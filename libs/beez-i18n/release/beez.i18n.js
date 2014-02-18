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
    define('beez.i18n',['require','exports','module','beez.core','beez.utils','handlebars'],function (require, exports, module) {
        

        var beez = require('beez.core');
        require('beez.utils');

        var logger = beez.getLogger('beez.i18n');
        var _ = beez.vendor._;

        if (beez.i18n) {
            logger.warn('beez.i18n is already loaded.');
            return beez.i18n;
        }

        var __I18n__ = {

            setup: function setup() {
                logger.warn('Setup has already been. beez.i18n');
                return this;
            },

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

