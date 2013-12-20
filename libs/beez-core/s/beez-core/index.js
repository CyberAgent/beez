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
    define(function (require, exports, module) {
        'use strict';

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
