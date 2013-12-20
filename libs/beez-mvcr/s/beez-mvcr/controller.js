/**
 * @fileOverview Controller/ControllerManager
 * @name controller.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define(function __Controller__(require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        require('beez.mvcr');
        require('beez.i18n');

        var logger = beez.getLogger('beez.mvcr.controller');

        var _ = beez.vendor._;

        // -------------------
        // ControllerManagerAsync

        /**
         * Controller management class, asynchronous
         *
         * @class
         * @name ControllerManagerAsync
         * @private
         * @param {ControllerManager} manager
         * @extends {Bucks}
         */
        var ControllerManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ControllerManagerAsync',
            {
                /**
                 * Constructor
                 *
                 * @memberof ControllerManagerAsync
                 * @instance
                 */
                initialize: function initialize(manager) {
                    this.manager = manager;
                },

                /**
                 * Generation of the Controller
                 *
                 * @memberof ControllerManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Controller|Array<Controller>} Controller Controller Object
                 * @param {Object|Array<Object>} [options] Arguments to the Controller
                 * @return {Controller}
                 */
                create: function create(name, Controller, options) {
                    var self = this;
                    return this.then(function createWrap(result, next) {

                        if (!Controller || typeof Controller !== 'function') {
                            throw new beez.Error('Controller does not exist / does not be funciton. Specified name: ' + name);
                        }
                        if (self.manager.controllers[name]) {
                            throw new beez.Error('It is a singleton in the module. name:' + name);
                        }

                        var controller = new Controller();
                        self.manager.controllers[name] = controller;
                        next(result, self.manager.controllers[name]);

                    }).then(function (controller, next) {
                        controller.loadCSS(function () { // initialize css load
                            next(null, controller);
                        });

                    }).then(function (controller, next) {
                        controller.loadI18n(function (err) { // initialize i18n load
                            if (err) {
                                logger.error('i18n load error. ', err.message);
                                logger.debug(err.stack);
                            }
                            next(err, controller);
                        });
                    });
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ControllerManagerAsync
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.manager;
                }
            }
        );

        // -------------------
        // ControllerManager

        /**
         * Controller management class.
         *
         * @class
         * @name ControllerManager
         */
        var ControllerManager = beez.extend(
            'beez.mvcr.ControllerManager',
            function constructor() {
                return this.initialize();
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ControllerManager
                 * @instance
                 */
                initialize: function initialize() {
                    this.controllers = {};
                },

                /**
                 * Generating ControllerManagerAsync
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @return {ControllerAsync}
                 */
                async: function async() {
                    return new ControllerManagerAsync(this);
                },

                /**
                 * Remove controller
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @param {String} name jsonPath name
                 * @return {ControllerManager}
                 */
                remove: function remove(name) {
                    var obj = this.get(name);
                    if (!obj) {
                        return this;
                    }
                    delete this.controllers[name];
                    return this;
                },

                /**
                 * From path, acquire Controller.
                 *
                 * @memberof ControllerManager
                 * @instance
                 * @param {String} name jsonPath name
                 * @return {Controller}
                 */
                get: function get(name) {
                    return this.controllers[name];
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ControllerManager
                 * @instance
                 */
                dispose: function () {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.controllers;
                }
            });


        // -------------------
        // Controller

        /**
         * Controller class.
         *
         * @namespace beez.mvcr
         * @class
         * @name Controller
         */
        var Controller = beez.extend(
            'beez.mvcr.Controller',
            function constructor() {
                this.initialize.apply(this, arguments);
            },
            {

                /**
                 * Constructor
                 *
                 * @memberof Controller
                 * @instance
                 */
                initialize: function initialize() {
                },

                /**
                 * automatic loading of i18n data.
                 * @memberof Controller
                 * @param {function} callback
                 */
                i18n: function i18n() {},

                /**
                 * automatic loading of i18n.
                 *
                 * @memberof Controller
                 * @param {function} callback Completion callback
                 * @instance
                 * @return {Controller}
                 */
                loadI18n: function loadI18n(callback) {
                    if (!beez.i18n) {
                        beez.createI18n();
                    }

                    var self = this;
                    if (beez.utils.is('Object', this.i18n)) { // dynamic load

                        var langs = [];
                        var paths = [];
                        _.each(this.i18n, function (path, lang) {
                            langs.push(lang);
                            paths.push(path);
                        });

                        require(paths, function () {
                            var list = Array.prototype.slice.call(arguments);
                            for (var i = 0; i < list.length; i++) {
                                var data = {};
                                data[langs[i]] = list[i];
                                beez.i18n.add(data);
                                logger.debug('i18n file loaded. path:', paths[i]);
                            }
                            callback && callback(null);
                        }, function (err) {
                            callback && callback(err);
                        });

                    } else if (beez.utils.is('Function', this.i18n)) { // static load
                        new beez.Bucks()
                            .add(function (err, res, next) {
                                if (0 < self.i18n.length) {
                                    self.i18n(function (err, res) {
                                        next(err, res);
                                    });
                                } else {
                                    next(null, self.i18n());
                                }
                            })
                            .add(function (err, res) {
                                if (res) {
                                    beez.i18n.add(res);
                                }
                                callback && callback(err, res);
                            })
                            .end();

                    } else {
                        callback && callback(new Error('The Controller.i18n, please be defined in Function.'));
                    }
                    return this;

                },

                /**
                 * automatic loading of css.
                 *
                 * @memberof Controller
                 * @param {function} callback Completion callback
                 * @instance
                 * @return {Controller}
                 */
                loadCSS: function loadCSS(callback) {
                    var paths = this.css;
                    if (!paths || paths.length < 1) {
                        return callback && callback();
                    }

                    var self = this;
                    var tasks = _.map(paths, function task(p) {
                        return function t(err, res, next) {
                            beez.manager.css.async()
                                .load(p)
                                .end(function (err1, res1) {
                                    next(err, res1[0]);
                                }, function (err2) {
                                    next(err2);
                                });
                        };
                    });

                    var b = new beez.Bucks();
                    b.parallel(tasks)
                        .end(function (err, ress) {
                            callback && callback(err, ress);
                        });

                    return this;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof Controller
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.constructor.prototype.css;
                }
            }
        );


        /**
         * extend function
         *
         * @memberof Controller
         * @function
         * @param {String} [name] instance name
         * @param {Object} childProto prototypes
         * @borrows beez.extendThis as extend
         * @example
         * var MyController = Controller.extend(
         *     'myapp.MyController',
         *     {
         *         bar: function bar() {}
         *     }
         * );
         */
        Controller.extend = beez.extendThis;

        return {
            Controller: Controller,
            ControllerManager: ControllerManager,
            ControllerManagerAsync: ControllerManagerAsync
        };
    });
})(this);
