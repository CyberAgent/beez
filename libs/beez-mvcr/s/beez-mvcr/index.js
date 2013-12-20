/**
 * @fileOverview beez.mvcr class
 * @name index.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    /**
     * mvcr namespace
     * @namespace beez.mvcr
     */
    define(function __MVCR__(require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var logger = beez.getLogger('beez.mvcr');

        if (beez.mvcr) {
            logger.debug('beez.mvcr already defined.');
            return beez.mvcr;
        }

        var Handlebars = require('handlebars');

        /**
         * Shortcut function
         *   Handlebars.templates[]
         * @memberof beez
         * @function
         * @name getTemplate
         * @param {String} name
         * @returns {Function} handlebars template function
         */
        beez.getTemplate = function getTemplate(name) {
            return Handlebars.templates[name];
        };

        var __MVCR__ = {
            initialize: function () {

                var model = require('beez-mvcr/model');
                var modic = require('beez-mvcr/modic');
                var view = require('beez-mvcr/view');
                var controller = require('beez-mvcr/controller');
                var router = require('beez-mvcr/router');
                var css = require('beez-mvcr/cssmanager');
                var image = require('beez-mvcr/imagemanager');
                var base = require('beez-mvcr/base');


                /**
                 * @name Model
                 * @memberof beez.mvcr
                 * @borrows Model
                 * @type {Model}
                 */
                this.Model = model.Model;

                /**
                 * @name ModelManager
                 * @memberof beez.mvcr
                 * @borrows ModelManager
                 * @type {ModelManager}
                 */
                this.ModelManager = model.ModelManager; // if you want to extend

                /**
                 * @name ModelManagerAsync
                 * @memberof beez.mvcr
                 * @borrows ModelManagerAsync
                 * @type {ModelManagerAsync}
                 */
                this.ModelManagerAsync = model.ModelManagerAsync; // if you want to extend

                /**
                 * @name Collection
                 * @memberof beez.mvcr
                 * @borrows Collection
                 * @type {Collection}
                 */
                this.Collection = model.Collection;

                /**
                 * @name Modic
                 * @memberof beez.mvcr
                 * @borrows Modic
                 * @type {Modic}
                 */
                this.Modic = modic.Modic;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows View
                 * @type {View}
                 */
                this.View = view.View;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewAsync
                 * @type {ViewAsync}
                 */
                this.ViewAsync = view.ViewAsync;

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewManager
                 * @type {View}
                 */
                this.ViewManager = view.ViewManager; // if you want to extend

                /**
                 * @name View
                 * @memberof beez.mvcr
                 * @borrows ViewManagerAsync
                 * @type {ViewManagerAsync}
                 */
                this.ViewManagerAsync = view.ViewManagerAsync; // if you want to extend


                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows Controller
                 * @type {Controller}
                 */
                this.Controller = controller.Controller;

                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows ControllerManager
                 * @type {Controller}
                 */
                this.ControllerManager = controller.ControllerManager; // if you want to extend

                /**
                 * @name Controller
                 * @memberof beez.mvcr
                 * @borrows ControllerManagerAsync
                 * @type {ControllerAsync}
                 */
                this.ControllerManagerAsync = controller.ControllerManagerAsync; // if you want to extend

                /**
                 * @name Router
                 * @memberof beez.mvcr
                 * @borrows Router
                 * @type {Router}
                 */
                this.Router = router.Router;

                /**
                 * @name RouterManager
                 * @memberof beez.mvcr
                 * @borrows RouterManager
                 * @type {RouterManager}
                 */
                this.RouterManager = router.RouterManager; // if you want to extend

                /**
                 * @name CSSManager
                 * @memberof beez.mvcr
                 * @borrows CSSManager
                 * @type {CSSManager}
                 */
                this.CSSManager = css.CSSManager;     // if you want to extend
                /**
                 * @name CSSManagerAsync
                 * @memberof beez.mvcr
                 * @borrows CSSManagerAsync
                 * @type {CSSManagerAsync}
                 */
                this.CSSManagerAsync = css.CSSManagerAsync;     // if you want to extend
                /**
                 * @name ImageManager
                 * @memberof beez.mvcr
                 * @borrows ImageManager
                 * @type {ImageManager}
                 */
                this.ImageManager = image.ImageManager; // if you want to extend
                /**
                 * @name ImageManagerAsync
                 * @memberof beez.mvcr
                 * @borrows ImageManagerAsync
                 * @type {ImageManagerAsync}
                 */
                this.ImageManagerAsync = image.ImageManagerAsync; // if you want to extend
                /**
                 * @name ManagerBase
                 * @memberof beez.mvcr
                 * @borrows ManagerBase
                 * @type {ManagerBase}
                 */
                this.ManagerBase = base.ManagerBase;
                /**
                 * @name Base
                 * @memberof beez.mvcr
                 * @borrows Base
                 * @type {Base}
                 */
                this.Base = base.Base;

            }
        };

        var MVCR = beez.extend(
            'beez.MVCR',
            function constructor() {
                return this.initialize();
            }, __MVCR__);

        var mvcr = new MVCR();


        // Add to beez object.
        beez.mvcr = mvcr;

        beez.Model = mvcr.Model;
        beez.Collection = mvcr.Collection;
        beez.Modic = mvcr.Modic;
        beez.View = mvcr.View;
        beez.Controller = mvcr.Controller;
        beez.Router = mvcr.Router;

        // Backbone shortcut
        var Backbone = require('backbone');
        /**
         * Backbone.history short cut.
         * @name history
         * @memberof beez
         */
        beez.history = Backbone.history;

        //
        // ----
        // Managers
        //

        var mconfig = beez.config.manager || {};

        var __Manager__ = {
            initialize: function () {
                /**
                 * setuped flag
                 * @memberof beez.manager
                 * @name setuped
                 * @type {Boolean}
                 */
                this.setuped = false;

                /**
                 * ModelManager instance
                 * @memberof beez.manager
                 * @name model
                 * @alias m
                 * @type {ModelManager}
                 */
                this.model = undefined;

                /**
                 * shortcut for model
                 * @memberof beez.manager
                 * @name m
                 * @type {ModelManager}
                 */
                this.m = undefined;

                /**
                 * ViewManager instance
                 * @memberof beez.manager
                 * @name view
                 * @type {ViewManager}
                 */
                this.view = undefined;

                /**
                 * shortcut for view
                 * @memberof beez.manager
                 * @name v
                 * @type {ViewManager}
                 */
                this.v = undefined;

                /**
                 * ControllerManager instance
                 * @memberof beez.manager
                 * @name controller
                 * @type {ControllerManager}
                 */
                this.controller = undefined;

                /**
                 * shortcut for controller
                 * @memberof beez.manager
                 * @name c
                 * @type {ControllerManager}
                 */
                this.c = undefined;

                /**
                 * RouterManager instance
                 * @memberof beez.manager
                 * @name router
                 * @type {RouterManager}
                 */
                this.router = undefined;

                /**
                 * shortcut for router
                 * @memberof beez.manager
                 * @name r
                 * @type {RouterManager}
                 */
                this.r = undefined;

                /**
                 * CSSManager instance
                 * @memberof beez.manager
                 * @name css
                 * @type {CSSManager}
                 */
                this.css = undefined;

                /**
                 * ImageManager instance
                 * @memberof beez.manager
                 * @name image
                 * @type {ImageManager}
                 */
                this.image = undefined;
            },

            /**
             * Beez MVCR Manager Setup
             *
             * @memberof MVCR
             * @instance
             * @public
             * @param {Object} objs It sets up to overwrite a management class.
             * @return {MVCR}
             */
            setup: function setup(objs) {
                if (this.setuped) {
                    return this;
                }

                objs = objs || {};
                this.setuped = true;

                // Initialize ModelManager
                if (objs.model) {
                    this.model = objs.model;
                } else {
                    var model = require('beez-mvcr/model');
                    this.model = new model.ModelManager('midx');
                }
                this.m = this.model; // shortcut


                // Initialize ViewManager
                if (objs.view) {
                    this.view = objs.view;
                } else {
                    var view = require('beez-mvcr/view');
                    this.view = new view.ViewManager('vidx');
                }
                this.v = this.view; // shortcut

                // Initialize ControllerManager
                if (objs.controller) {
                    this.controller = objs.controller;
                } else {
                    var controller = require('beez-mvcr/controller');
                    this.controller = new controller.ControllerManager();
                }
                this.c = this.controller; // shortcut


                // Initialize RouterManager
                if (objs.router) {
                    this.router = objs.router;
                } else {
                    var router = require('beez-mvcr/router');
                    this.router = new router.RouterManager();
                }
                this.r = this.router; // shortcut

                // Initialize CSSManager
                if (objs.css) {
                    this.css = objs.css;
                } else {
                    var css = require('beez-mvcr/cssmanager');
                    this.css = new css.CSSManager();
                }

                // Initialize ImageManager
                if (objs.image) {
                    this.image = objs.image;
                } else {
                    var image = require('beez-mvcr/imagemanager');
                    this.image = new image.ImageManager(mconfig.image);
                }
                return this;
            }
        };

        var Manager = beez.extend(
            'beez.Manager',
            function constructor() {
                return this.initialize();
            }, __Manager__);

        var manager = new Manager();
        mvcr.manager = manager;
        beez.manager = mvcr.manager; // shortcut

        return beez.mvcr;
    });
})(this);
