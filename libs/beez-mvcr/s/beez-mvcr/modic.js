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
    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var _ = beez.vendor._;
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
