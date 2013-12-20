/**
 * @name index.js<core>
 * @author <author>
 * @overview controller of core module
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require("beez");
    var logger = beez.getLogger('core.index');

    var CoreController = beez.Controller.extend(
        'core.coreController',
        {
            i18n: function i18n() {
                return {
                    en: require('core/i18n/en'),
                    ja: require('core/i18n/ja')
                };
            },

            initialize: function initialize() {
            }

            //

        });

    return CoreController;
});
