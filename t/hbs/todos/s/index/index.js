/**
 * @name index.js<index>
 * @author <author>
 * @overview entry point of this project
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var Backbone = beez.vendor.backbone;

    var logger = beez.getLogger('index.index');

    var mv = beez.manager.v; // View Manager
    var mm = beez.manager.m; // Model Manager

    /**
     * Index Controller class
     *
     * @namespace index
     * @class
     * @name IndexController
     * @extends {beez.Controller}
     * @see beez.Controller
     */
    var IndexController = beez.Controller.extend(
        'index.IndexController',
        {

            /**
             * The set-up the controller
             *
             * @memberof IndexController
             * @name setup
             * @param {function} callback
             * @return {IndexController}
             */
            setup: function setup(callback) {
                // Setup Root View and Model
                var IndexView = require('index/view/index');
                mv.root(IndexView);
                var IndexModel = require('index/Model/index');
                mm.root(IndexModel);

                // Setup Core Module
                var CoreController = require('core/index');
                beez.manager.c
                    .async()
                    .create('core', CoreController)
                    .then(function (controller) {
                        callback && callback();
                    })
                    .end()
                ;

                return this;
            },

            /**
             * Routing: index
             *
             * @memberof IndexController
             * @name index
             */
            index: function index() {
                var InfoView = require('index/view/info');
                mv.create('/@', InfoView);

                mv.get('/@').async().show().then(function () {
                    beez.manager.r.navigate('todos'); // Next submodule ....

                }).end();
            }
        });

    return IndexController;

});
