/**
 * @fileOverview Router
 * @name router.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagnet.co.jp>
 */

(function (global) {
    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        require('beez.mvcr');

        var logger = beez.getLogger('beez.mvcr.router');

        var _ = beez.vendor._;
        var Backbone = require('backbone');

        var __RouterManager__ = {


            initialize: function initialize() {

                /**
                 * Router instance (singleton)
                 *
                 * @memberof RouterManager
                 * @instance
                 */
                this.router = undefined;

                /**
                 * Router setup is complete
                 *
                 * @memberof RouterManager
                 * @instance
                 */
                this.setuped = false;
            },

            /**
             * router is initialized and routing is setuped.
             *
             * @memberof RouterManager
             * @instance
             * @param {Object} [options] overwrite merge the routes pass the set of routes
             * @param {beez.Router} [Router] Expanded Router instance.
             */
            setup: function setup(options, router) {
                var self = this;

                /* jshint loopfunc: true */
                if (this.setuped) {
                    throw new beez.Error('Already been executed once. If you want to add a route, please refer to the function add().');
                }

                var config = beez.config.router || {};
                var routes = _.extend(config, options); // merge

                //logger.debug("router.setup", JSON.stringify(routes));

                if (this.router) {
                    return this;
                }

                // router extend or create
                this.router = router || new beez.Router();

                // register routes
                var names = _.keys(routes);
                for (var i = 0; i < names.length; i++) {
                    var key = names[i];
                    var data = routes[key];

                    //logger.debug('router.route', key, JSON.stringify(data));

                    this.router.route(data.route, data.name, (function (name) {
                        function proxy() {

                            if (!routes.hasOwnProperty(name)) {
                                throw new beez.Error('route map key does not exist. name: ' + name);
                            }
                            var data = routes[name];
                            //var parameter = arguments;
                            var parameter = Array.prototype.slice.call(arguments);


                            logger.debug("router.proxy", data);


                            var job = new beez.Bucks();

                            job.then(function (res, next) {
                                if (beez.manager.c.get(data.xpath)) { // Already controller loaded
                                    return next();
                                }

                                // First controller load function
                                if (data.async) { // Asynchronous

                                    if (self.router.firstBefore.length !== 2) {
                                        throw new beez.Error('You should pass a callback function in arguments in case of async setting is true. firestBefore(data, callback)');
                                    }

                                    logger.trace("run controller firstBefore function(async). data:", data);
                                    self.router.firstBefore(data, function (err, res) {
                                        next(null, res);
                                    });

                                } else { // Synchronism
                                    logger.trace("run controller firstBefore function(sync). data:", data);
                                    self.router.firstBefore(data);
                                    next();
                                }
                            });

                            job.then(function (res, next) {
                                require([data.require], function cnavigate(_Controller) {

                                    logger.debug("controller.exec", data.xpath);
                                    var _controller = beez.manager.c.get(data.xpath);

                                    var state = {};
                                    if (_controller) {
                                        state.isFirstBefore = true;
                                        next(null, {Controller: _Controller, controller: _controller, state: state});
                                        return;
                                    }
                                    beez.manager.c.async().create(data.xpath, _Controller).then(function (_controller) {
                                        state.isFirstBefore = false;
                                        next(null, {Controller: _Controller, controller: _controller, state: state});
                                    }).end();
                                });
                            });

                            job.then(function (res, next) {
                                var controller = res.controller;
                                var Controller = res.Controller;
                                // set state
                                data.state = res.state;

                                if (!controller[data.name]) {
                                    throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                }
                                if (data.async) {

                                    if (self.router.before.length !== 3) {
                                        throw new beez.Error('You should pass a callback function in arguments in case of async setting is true. before(data, Controller, callback)');
                                    }

                                    logger.trace("run controller before function(async). data:", data);
                                    self.router.before(data, Controller, function (err, res) { // run before function

                                        parameter.push(function (err, res) { // set after callback
                                            if (self.router.after.length !== 3) {
                                                throw new beez.Error('You should pass a callback function in arguments in case of async setting is true. after(data, Controller, callback)');
                                            }

                                            logger.trace("run controller after function(async). data:", data);
                                            self.router.after(data, Controller, function (err, res) { // run after function
                                                next();
                                            });
                                        });

                                        if (controller[data.name].length !== parameter.length) {
                                            throw new beez.Error('"Controller.' + data.name + '" function should takes ' + parameter.length + ' arguments. (' + controller[data.name].length + ')');
                                        }
                                        controller[data.name].apply(controller, parameter);
                                    });

                                } else {

                                    logger.trace("run controller before function(sync). data:", data);
                                    self.router.before(data, Controller); // run before function

                                    controller[data.name].apply(controller, parameter); // exec!!

                                    logger.trace("run controller after function(sync). data:", data);
                                    self.router.after(data, Controller); // run after function

                                    next();
                                }
                            });

                            job.end(); // fire!!!


                            /**
                            // processing of controller before loading.
                            if (!beez.manager.c.get(data.xpath)) {
                                logger.trace("run controller firstBefore function. data:", data);
                                self.router.firstBefore(data);
                            }

                            require([data.require], function cnavigate(_Controller) {

                                logger.debug("controller.exec", data.xpath);
                                var controller = beez.manager.c.get(data.xpath);
                                if (controller) {
                                    if (!controller[data.name]) {
                                        throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                    }

                                    logger.trace("run controller before function. data:", data);
                                    self.router.before(data, _Controller); // run before function

                                    controller[data.name].apply(controller, parameter); // exec!!

                                    logger.trace("run controller after function. data:", data);
                                    self.router.after(data, _Controller); // run after function

                                } else {
                                    beez.manager.c.async().create(data.xpath, _Controller).then(function (controller) {
                                        if (!controller[data.name]) {
                                            throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                        }

                                        logger.trace("run controller before function. data:", data);
                                        self.router.before(data, _Controller); // run before function

                                        controller[data.name].apply(controller, parameter); // exec!!

                                        logger.trace("run controller after function. data:", data);
                                        self.router.after(data, _Controller); // run after function

                                    }).end();
                                }
                            });
                            */
                        }


                        return proxy;

                    })(key));
                }
                this.setuped = true;
            },

            /**
             * @see Backbone#Router.navigate
             *
             * @memberof RouterManager
             * @instance
             * @see Router
             */
            navigate: function navigate(fragment, options) {
                if (!this.setuped || !this.router) {
                    throw new beez.Error(
                        'Initialization has not been performed even once. Please do a "setup()".');
                }
                return this.router.navigate(fragment, options);
            },

            /**
             * Dispose self instance
             *
             * @name dispose
             * @memberof RouterManager
             * @instance
             */
            dispose: function dispse() {
                logger.trace(this.constructor.name, 'dispose');
                this.router && this.router.dispose && this.router.dispose();
                delete this.router;
                delete this.setuped;
            }
        };

        /**
         * Routing management class.
         *
         * @class
         * @name RouterManager
         */
        var RouterManager = beez.extend(
            'beez.mvcr.RouterManager',
            function constructor() {
                return this.initialize();
            }, __RouterManager__);


        /**
         * Router Class (singleton)
         * @class
         * @name Router
         * @extends {Backbone.Router}
         * @see Backbone.Router
         */
        var Router = beez.extend(
            'beez.mvcr.Router',
            Backbone.Router,
            {

                /**
                 * @memberof Router
                 */
                constructor: function constructor() {
                    Router.__super__.constructor.apply(this, arguments);
                },

                /**
                 * Constructor
                 *
                 * @memberof Router
                 * @instance
                 */
                initialize: function initialize() {
                    Router.__super__.initialize.apply(this, arguments);
                },

                /**
                 * Interrupt processing of execution first before the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @instance
                 */
                firstBefore: function firstBefore(data, next) {
                    if (next) {
                        next();
                    }
                },
                /**
                 * Interrupt processing of execution before the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @param {Controller} Controller Controller class of target
                 * @instance
                 */
                before: function before(data, Controller, next) {
                    if (next) {
                        next();
                    }
                },

                /**
                 * Interrupt processing of execution after the controller.
                 *
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @param {Controller} Controller Controller class of target
                 * @instance
                 */
                after: function after(data, Controller, next) {
                    if (next) {
                        next();
                    }
                },

                /**
                 * Dispose self instance
                 *
                 * @name dispose
                 * @memberof Router
                 * @instance
                 */
                dispose: function dispse() {
                    logger.trace(this.constructor.name, 'dispose');
                }
            }
        );

        /**
         * @memberof Router
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @example
         * var MyRouter = beez.Router.extend(
         *     'myapp.MyRouter',
         *     {
         *     }
         * );
         */
        Router.extend = beez.extendThis;

        return {
            Router: Router,
            RouterManager: RouterManager
        };
    });
})(this);
