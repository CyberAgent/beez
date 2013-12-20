/**
 * @name index.js<core>
 * @author <author>
 * @overview controller of core module
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require("beez");
    var logger = beez.getLogger('core.index');

    /**
     * Core Controller class
     *
     * @namespace core
     * @class
     * @name CoreController
     * @extends {beez.Controller}
     * @see beez.Controller
     */
    var CoreController = beez.Controller.extend(
        'core.CoreController',
        {
            /**
             * Define i18n
             *
             * @memberof CoreController
             * @name i18n
             * @override beez.Controller.i18n
             * @protected
             */
            i18n: function i18n() {
                return {
                    en: require('core/i18n/en'),
                    ja: require('core/i18n/ja')
                };
            },

            /**
             * call initialize method
             *
             * @memberof CoreController
             * @name initialize
             * @override beez.Controller.initialize
             */
            initialize: function initialize() {
                //
            }

            //

        });

    return CoreController;
});
