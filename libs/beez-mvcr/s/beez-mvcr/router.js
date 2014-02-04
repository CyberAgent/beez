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

                            var data = routes[name]; // routing data
                            var parameter = Array.prototype.slice.call(arguments);
                            var job = new beez.Bucks();
                            var isLoaded = !!beez.manager.c.get(data.xpath);
                            var isAsync = data.async;

                            logger.debug("router.proxy", data);


                            /**
                             * normalize asyncronous handler
                             * @param  {Controller} controller
                             * @param  {String}   name
                             * @param  {Array}   parameter
                             * @param  {Function} callback
                             */
                            var normalize = function (controller, name, parameter, callback) {
                                var method = controller[name],
                                    length = method.length,
                                    args = _.clone(parameter);

                                if (length && isAsync) {
                                    args[length - 1] = callback;
                                    method.apply(controller, args);
                                } else {
                                    method.apply(controller, args);
                                    callback();
                                }
                            };

                            /**
                             * Process of controller method
                             *
                             * Processing is performed by the flow of
                             * [beforeOnce -> before -> render -> after -> afterOnce].
                             */
                            var _exec = function (controller, name, parameter, callback) {
                                var job = new beez.Bucks();

                                // call before once
                                if (!controller.state.isBeforeOnce) {
                                    job.then(function beforeOnce(res, next) {
                                        normalize(controller, 'beforeOnce', parameter, function () {
                                            controller.state.isBeforeOnce = true;
                                            next(null, controller);
                                        });
                                    });
                                }
                                // call before
                                job.then(function before(res, next) {
                                    normalize(controller, 'before', parameter, function () {
                                        next(null, controller);
                                    });
                                });
                                // call method
                                job.then(function exec(res, next) {
                                    normalize(controller, name, parameter, function () {
                                        next(null, controller);
                                    });
                                });
                                // call after
                                job.then(function after(res, next) {
                                    normalize(controller, 'after', parameter, function () {
                                        next(null, controller);
                                    });
                                });
                                // call afterOnce
                                if (!controller.state.isAfterOnce) {
                                    job.then(function afterOnce(res, next) {
                                        normalize(controller, 'afterOnce', parameter, function () {
                                            controller.state.isAfterOnce = true;
                                            next(null, controller);
                                        });
                                    });
                                }
                                // exec router.after
                                job.then(function () {
                                    callback && callback();
                                });

                                // fire!!
                                job.end(
                                    function last(err) {
                                        if (err) {
                                            logger.error(err.message);
                                            throw new beez.Error(err);
                                        }
                                    },
                                    function finalError(err) {
                                        if (err) {
                                            logger.error(err.message);
                                            throw new beez.Error(err);
                                        }
                                    }
                                );
                            };


                            // first before function
                            if (!isLoaded) {
                                job.then(function firstBefore(res, next) {

                                    // First controller load function
                                    if (isAsync) { // Asynchronous
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
                                        next(null, res);
                                    }
                                });
                            }

                            // create controller
                            job.then(function create(res, next) {
                                require([data.require], function cnavigate(_Controller) {
                                    var _controller = beez.manager.c.get(data.xpath);
                                    var state = {};
                                    state.isFirstBefore = !isLoaded;

                                    var result = {Controller: _Controller, controller: _controller, state: state};

                                    if (isLoaded) {
                                        next(null, result);
                                    } else {
                                        beez.manager.c.async().create(data.xpath, _Controller).then(function (_controller) {
                                            result.controller = _controller;
                                            next(null, result);
                                        }).end();
                                    }

                                });
                            });

                            // before
                            job.then(function exec(res, next) {
                                var Controller = res.Controller;
                                data.state = res.state;
                                if (isAsync) {
                                    if (self.router.before.length !== 3) {
                                        throw new beez.Error('You should pass a callback function in arguments in case of async setting is true. before(data, Controller, callback)');
                                    }
                                    logger.trace("run controller before function(async). data:", data);
                                    self.router.before(data, Controller, function () {
                                        next(null, res);
                                    });
                                } else {
                                    logger.trace("run controller before function(sync). data:", data);
                                    self.router.before(data, Controller);
                                    next(null, res);
                                }

                            });

                            // exec
                            job.then(function exec(res, next) {
                                var controller = res.controller;

                                if (!controller[data.name]) {
                                    throw new beez.Error('"' + data.name + '" to Controller I is undefined.');
                                }

                                if (isAsync) {
                                    logger.trace("run controller exec function(async). data:", data);
                                    _exec(controller, data.name, parameter, function () {
                                        next(null, res);
                                    });
                                } else {
                                    logger.trace("run controller exec function(sync). data:", data);
                                    _exec(controller, data.name, parameter);
                                    next(null, res);
                                }

                            });

                            // after function
                            job.then(function after(res, next) {
                                logger.trace('run controller after function(sync). data:', data);

                                if (isAsync) {

                                    if (self.router.after.length !== 3) {
                                        throw new beez.Error('You should pass a callback function in arguments in case of async setting is true. after(data, Controller, callback)');
                                    }

                                    logger.trace("run controller after function(async). data:", data);
                                    self.router.after(data, res.Controller, function (err) {
                                        next(err, res);
                                    });

                                } else {

                                    logger.trace("run controller after function(sync). data:", data);
                                    self.router.after(data, res.Controller);
                                    next(null, res);

                                }
                            });

                            // first after function
                            if (!isLoaded) {
                                job.then(function firstAfter(res, next) {
                                    logger.trace('run controller first after function');

                                    self.router.firstAfter(data, res.Controller, function (err, res) {
                                        next(err, res);
                                    });
                                });
                            }

                            job.end(); // fire!!!

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

                /*
                 * Interrupt processing of execution first[
                 * ] after the controller.
                 * @memberof Router
                 * @param {Object} data Router information of the target.
                 * @param {Controller} Controller Controller class of target
                 * @instance
                 */
                firstAfter: function firstAfter(data, Controller, next) {
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
