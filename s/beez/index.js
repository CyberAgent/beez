/** @license MIT License (c) 2012-2013 Cyberagent Inc. */
/**
 * @name index.js<beez>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview beez entrypoint
 */

var VERSION = '1.0.8';

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
        define(function (require, exports, module) {
            'use strict';

            var beez = require('beez.core');
            var mvcr = require('beez.mvcr');
            var utils = require('beez.utils');
            var i18n = require('beez.i18n');
            var ua = require('beez.ua');

            return beez;
        });

    })(this);
}
