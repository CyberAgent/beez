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
    define(function (require, module, exports) {
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
