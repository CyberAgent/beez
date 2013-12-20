/**
 * @fileOverview CSSManager
 * @name cssmanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var logger = beez.getLogger('beez.mvcr.cssmanager');

        var _ = beez.vendor._;
        var $ = beez.vendor.$;

        // -------------------
        // functions

        /**
         * @see CSSManager.isExists
         */
        var isExists = function isExists(path) {
            var stylesheets = document.styleSheets;
            var found = _.find(stylesheets, function (sheet) {
                var href = sheet.href;
                return (href && href.indexOf(path) !== -1);
            });
            return found && found.rules && found.rules.length > 0;
        };

        /**
         * @see CSSManager.isLoaded
         */
        var isLoaded = function isLoaded(path) {
            var stylesheets = document.styleSheets;

            var found = _.find(stylesheets, function (sheet) {
                var href = sheet.href;
                return (href && href.indexOf(path) !== -1);
            });
            return !!found;
        };

        // -------------------
        // CSSManagerAsync

        /**
         * Load the CSS with the given path, and then run the callback in the timing that have been added to the document.styleSheets. (asynchronous)
         *
         * @class
         * @name CSSManagerAsync
         * @private
         * @param {CSSManager} manager
         * @extends {Bucks}
         *
         * @example
         * var async = new CSSManagerAsync('/index.css');
         * async.then(function() {
         *     // succesfully loaded
         * }).error(function err() {
         *     // error on loading
         * }).end();
         *
         */
        var CSSManagerAsync = beez.Bucks.extend(
            'beez.mvcr.CSSManagerAsync',
            {

                initialize: function initialize(manager) {
                    this.manager = manager;
                    this._path = '';
                    this._intervalId = undefined;
                    this._timeoutId = undefined;

                    // load-checking interval
                    this.INTERVAL = (
                        (beez.config.manager &&
                         beez.config.manager.css &&
                         beez.config.manager.css.interval) || 1000 / 20
                    );

                    // load-timeout
                    this.TIMEOUT = (
                        (beez.config.manager &&
                         beez.config.manager.css &&
                         beez.config.manager.css.timeout) || 1000 * 10
                    );
                },

                /**
                 * CSS is loaded.
                 * Warnnig: The present condition and the unific method of detecting HTTP Response Code (404, ...) are not found.
                 * When http or https is in a head, it loads by name directly.
                 *
                 * @memberof CSSManagerAsync
                 * @instance
                 * @asynchronous
                 *
                 * @example
                 * CSSManager.load('/index.css')
                 * .error(function onError() {
                 * // timeout etc
                 * })
                 * .then(function then() {
                 * })
                 * .end();
                 */
                load: function load(name) {
                    var self = this;

                    var path = this._path = name;
                    if (!name.match(/^(http|https):\/\/.+$/)) {
                        path = this._path = this.manager.name2path(name);
                    }

                    if (!path) {
                        return this.empty(); // ignore
                    }

                    if (this.manager.isLoaded(path)) {
                        logger.debug('path:', path, 'already exists');
                        path = undefined;
                        return this.empty(); // ignore
                    }

                    // insert link tag for stylesheet
                    var linkstyleTag = '<link rel="stylesheet" href="' + _.escape(path) + '" ></link>';
                    $('head').append(linkstyleTag);

                    return this.then(function loadWrap(res, next) {

                        self._intervalId = setInterval(function () { // TODO: utils#timer replace
                            if (isLoaded(path)) { //stylesheetが存在
                                self.abort(); //ruleが存在
                                logger.debug('load finished. path:', path);
                                next();
                            }
                        }, self.INTERVAL);

                        self._timeoutId = setTimeout(function () { // TODO: utils#timer replace
                            self.abort();
                            next(new beez.Error('loading timed out. path:' + path));
                        }, self.TIMEOUT);
                    });
                },

                /**
                 * remove the link tag in the path contained in the name.
                 *
                 * @asynchronous
                 * @memberof CSSManagerAsync
                 * @insntace
                 *c @param {String} name
                 */
                remove: function remove(name) {
                    var self = this;
                    return this.then(function remove() {
                        return self.manager.remove(name);
                    });
                },

                /**
                 * Cancel the monitor.
                 *
                 * @instance
                 * @memberof CSSManagerAsync
                 */
                abort: function abort() {
                    clearTimeout(this._timeoutId);
                    clearInterval(this._intervalId);
                    delete this._timeoutId;
                    delete this._intervalId;
                    delete this.INTERVAL;
                    delete this.TIMEOUT;
                },

                /**
                 * Disposes of the instance
                 *
                 * @instance
                 * @memberof CSSManagerAsync
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.manager;
                    delete this._path;
                    this.abort();
                }
            }
        );

        // -------------------
        // CSSManager

        /**
         * Load the CSS with the given path, and then run the callback in the timing that have been added to the document.styleSheets. (asynchronous)
         *
         * @class
         * @name CSSManager
         */
        var CSSManager = beez.extend(
            'beez.mvcr.CSSManager',
            function constructor() {
                return this.initialize();
            },
            {

                initialize: function initialize() {
                    this._basePath = ''; // Force / in the end

                    if (beez.config.url && beez.config.url.base) {
                        this._basePath = beez.config.url.base;
                        this._basePath.replace(/\/$/, '');
                    }

                },

                /**
                 * name is changed into path.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @param {String} name
                 * @return {String}
                 */
                name2path: function name2path(name) {
                    var path = '';
                    if (!this._basePath) {
                        path = name;
                    } else {
                        if (name.indexOf('/') === 0) {
                            path = this._basePath + name;
                        } else {
                            path = this._basePath + '/' + name;
                        }
                    }
                    return path;
                },

                /**
                 * Asynchronous instance generation.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @return {CSSManagerAsync}
                 */
                async: function async() {
                    return new CSSManagerAsync(this);
                },

                /**
                 * remove the link tag in the path contained in the name.
                 *
                 * @memberof CSSManager
                 * @insntace
                 * @param {String} name
                 */
                remove: function remove(name) {
                    var $stylelinks = $('link[rel=stylesheet]');
                    $stylelinks.each(function () {
                        if (this.href.indexOf(name) !== -1) {
                            logger.debug('remove finished. name:', name, 'path:', this.href);
                            $(this).remove();
                        }
                    });
                    return this;
                },

                /**
                 * Check css path specified in the present.
                 *
                 * @memberof CSSManager
                 * @instance
                 * @param {String} path
                 * @return {boolean}
                 */
                isExists: isExists,

                /**
                 * CSS is loaded?
                 * Warnnig: Relative paths are not expected.
                 *
                 * @memberof CSSManager
                 * @instance
                 * @param {String} path
                 * @return {boolean}
                 */
                isLoaded: isLoaded,

                /**
                 * Disposes of the instance
                 *  @memberof CSSManager
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this._basePath;
                }
            }
        );

        // -------------------
        // return

        return {
            CSSManager: CSSManager,
            CSSManagerAsync: CSSManagerAsync
        };
    });

})(this);
