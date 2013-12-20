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

    var mv = beez.manager.v; // Viwe Manager
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
            css: [
                'http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.0/css/bootstrap.css',
                '/index/styl/index.css'
            ],

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

                var HeaderView = require('index/view/header');
                mv.create('/@', HeaderView);

                var ContentView = require('index/view/content');
                mv.create('/@', ContentView);

                var FooterView = require('index/view/footer');
                mv.create('/@', FooterView);

                var IndexModel = require('index/Model/index');
                mm.root(IndexModel);

                callback && callback();
                return this;
            },

            /**
             * Routing: index
             *
             * @memberof IndexController
             * @name index
             */
            index: function index() {
                mv.get('/@').async().show().then(function () {
                    beez.manager.r.navigate('search', true);
                }).end();
            }
        }
    );

    return IndexController;


});
