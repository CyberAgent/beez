/**
 * @fileOverview CSSManager
 * @name imagemanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * @overview image management functions
 */

(function (global) {

    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var utils = require('beez.utils');
        var _ = beez.vendor._;
        var $ = beez.vendor.$;

        var logger = beez.getLogger('beez.mvcr.imagemanager');

        /**
         * transparent-1px image data
         * @type {String}
         */
        var transparentImageDataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAA1JREFUeNoBAgD9/wAAAAIAAVMrnDAAAAAASUVORK5CYII=';

        var _uid = 0;
        var uid = function uid() {
            return '__beez_manager_image_uid_' + _uid++;
        };

        var DEFAULT_CACHEKEY = '_';
        /**
         * get URL sting to isolate cache of asset from that of gotten by css with specifying URL query string
         * @private
         * @param {String} url specify URL of image asset
         * @param {Object} options for cache isolating
         * @returns {String} URL string of cache-isolated
         */
        function ensureUrlIsolated(url, options) {
            options || (options = {});
            var cacheKey = (options.cacheKey || DEFAULT_CACHEKEY);
            var cacheId = (options.cacheId || Date.now()); // if not specified, use current timestamp. that is, never cached.
            var strCacheIsolator = cacheKey + '=' + cacheId;
            if (url.indexOf(strCacheIsolator) === -1) {
                url += (-1 < url.indexOf('?') ? '&' : '?') + strCacheIsolator;
            }

            return url;
        }

        /**
         * Class that manages multiple Image Object. re-use function of <img>.
         *
         * @class
         * @name ImangePool
         * @private
         * @param {int} size Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
         * @throw {Error}
         */
        var ImangePool = beez.extend(
            'beez.mvcr.ImagePool',
            function constructor(size, options) {
                return this.initialize(size, options);
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ImangePool
                 * @instance
                 * @param {int} size Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
                 * @param {Object} options for creating image
                 */
                initialize: function initialize(size, options) {
                    /**
                     * for creating image
                     *
                     * @memberof ImangePool
                     * @instance
                     * @property {Object} options
                     */
                    this.options = options || {};

                    /**
                     * pool limit
                     *
                     * @memberof ImangePool
                     * @instance
                     * @property {int} limit
                     */
                    this.limit = size;

                    /**
                     * The total number of generated HTMLImageElement
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._total = 0;

                    /**
                     * HTMLImageElement total number in use.
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._num_used = 0;

                    /**
                     * HTMLImageElement hash in use.
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     */
                    this._using = {};

                    /**
                     * Waiting for reuse HTMLImageElement
                     *
                     * @memberof ImangePool
                     * @instance
                     * @private
                     * @return {Array}
                     */
                    this._unused = [];
                },


                /**
                 * Generate HTMLImageElement.
                 *
                 * It is returned when there is recyclable HTMLImageElement.
                 * release() is given to HTMLImageElement.
                 * Please call release () to always While destroying HTMLImageElement.
                 *
                 * @memberof ImangePool
                 * @instance
                 * @param {Object} options for creating image
                 * @return {HTMLImageElement}
                 */
                create: function create(options) {
                    var elem;
                    //options = options || this.options || {}; // default) not "Anonymous"
                    options = options || {}; // default) not "Anonymous"

                    if (this._unused.length > 0) {
                        elem = this._unused.pop();
                    } else {
                        if (this.limit > 0 && this._total >= this.limit) {
                            throw new beez.Error('image pool limit exceeds!');
                        }
                        elem = new Image();
                        elem.__beez_manager_image_uid = uid();
                        this._total++;
                    }

                    //elem.crossOrigin = options.crossOrigin ? options.crossOrigin : elem.crossOrigin;
                    //elem.crossOrigin = options.crossOrigin ? options.crossOrigin : options.crossOrigin;

                    if (options.crossOrigin) {
                        elem.crossOrigin = options.crossOrigin;
                    } else if (this.options.crossOrigin) {
                        elem.crossOrigin = this.options.crossOrigin;
                    }

                    this._num_used++;
                    this._using[elem.__beez_manager_image_uid] = elem;

                    var self = this;

                    /**
                     * The HTMLImageelement waiting for reuse.
                     * This function will be removed in the release() timing.
                     */
                    elem.release = function release() {
                        this.removeAttribute('crossorigin'); // turn off CORS mode
                        this.src = transparentImageDataURI;
                        this.removeAttribute("class");
                        this.removeAttribute("height");
                        this.removeAttribute("width");
                        this.removeAttribute("id");
                        this.removeAttribute("name");

                        self._using && delete self._using[this.__beez_manager_image_uid];
                        self._unused && self._unused.push(this);
                        self._num_used && self._num_used--;
                        delete this.release;
                    };

                    return elem;
                },


                /**
                 * It is the number of HTMLImageElement(s) during use.
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                living: function living() {
                    return this._num_used;
                },


                /**
                 * The total number of HTMLImageElement
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                peak: function peak() {
                    return this._total;
                },


                /**
                 * Waiting for reuse of HTMLImageElement
                 *
                 * @memberof ImangePool
                 * @instance
                 * @returns {int}
                 */
                waiting: function waiting() {
                    return this._unused.length;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ImangePool
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    // release all of using images
                    for (var id in this._using) {
                        this._using[id].release();
                    }
                    delete this._using;

                    while (this._unused.length > 0) {
                        var e = this._unused.pop();
                        delete e.__beez_manager_image_uid;
                    }
                    delete this._unused;

                    delete this._num_used;
                    delete this._total;
                    delete this._limit;
                }
            }
        );



        /**
         * Image management class. asynchronous
         *
         * @class
         * @name ImageManagerAsync
         * @private
         * @extends Bucks
         * @example
         * var l = new ImageManagerAsync();
         * l.load('http://...').then(res, next) {
         *     // res[0] is loaded image
         * }).end();
         */
        var ImageManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ImageManagerAsync',
            {
                /**
                 * Constructor
                 * @memberof ImageManagerAsync
                 */
                initialize: function initialize(imageManager) {
                    this.imageManager = imageManager;
                    this.cacheKey = imageManager.cacheKey;
                },

                /**
                 * Load the image.
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @param {String} url
                 * @param {Object} options for creating image
                 * @return {Bucks}
                 * @example
                 * loader.loadOne('http://...').then(function onload(res, next) {
                 *     // res is a loaded-image
                 *     // next(null, ...)
                 * }).error(function onError(err, next) {
                 *     // on error
                 * }).end();
                 */
                loadOne: function loadOne(url, options) {

                    var img = this.imageManager.create(options);
                    var self = this;

                    var cacheKey = this.cacheKey;
                    var cacheId;
                    if (options) {
                        cacheKey = options.cacheKey || cacheKey;
                        cacheId = options.cacheId;
                    }

                    return this.add(function loadTask(err, res, next) {

                        var $img = $(img);

                        var onLoad = function onLoad() {
                            $img.off();
                            next(null, img);
                        };
                        var onError = function onError(ev) {
                            var src = img.src;

                            $img.off();
                            img.release();
                            next(new beez.Error('error on load image. src:' + src));
                        };
                        var onAbort = function onAbort(ev) {
                            var src = img.src;

                            $img.off();
                            img.release();
                            next(new beez.Error('image loading aborted. src:' + src));
                        };

                        $img.on('load', onLoad);
                        $img.on('error', onError);
                        $img.on('abort', onAbort);

                        // start loading
                        var _url = self.imageManager.imageUrl(url); // replace ${ratio}
                        cacheId && (_url = ensureUrlIsolated(_url, { cacheKey: cacheKey, cacheId: cacheId })); // if cacheId specified, append query string
                        img.src = _url;
                    });
                },

                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @param {String|Array} url ex) Array: ['hoge.png', 'foo.png']
                 * @param {Object|Array} options ex) Array: [{crossOrigin: "Anonymous"}, {crossOrigin: ""}]
                 * @return {Bucks} ex.) {res:[HTMLImageElement, null, null, HTMLImageElement], err:[null, Error, Error, HTMLImageElement]}
                 */
                load: function load(url, options) {

                    // param check and Array-nize
                    if (_.isString(url)) {
                        url = [url];
                    } else if (!_.isArray(url)) {
                        throw new beez.Error('url can be String or Array of string.');
                    }

                    // param check and Array-nize

                    options = options || {};
                    if (!_.isArray(options)) {
                        if (_.isObject(options)) {
                            options = [options];
                        } else {
                            throw new beez.Error('options can be Object or Array of object.');
                        }
                    }

                    // make tasks
                    var self = this;
                    var tasks = _.map(url, function makeTask(u, idx) {
                        return function loadTask(err, res, next) {
                            new ImageManagerAsync(self.imageManager)
                                .loadOne(u, options[idx])
                                .end(function complete(err, res) {
                                    next(err, res[0]);
                                }, function onError(e) {
                                    next(e);
                                });
                        };
                    });

                    // parallel load
                    return this.parallel(tasks);
                },

                /**
                 * dispose this ImageManagerAsync
                 *
                 * @memberof ImageManagerAsync
                 * @instance
                 * @private
                 */
                dispose: function dispose() {
                    delete this.imageManager;
                }
            }
        );



        /**
         * Image management class. synchronism
         *
         * @class
         * @name ImageManager
         * @param {Object} [options]
         * @param {int} [options.size] Pool size. Throw Error when exceeds the specified size. Setting "0", unlimited.
         */
        var ImageManager = beez.extend(
            'beez.mvcr.ImageManager',
            function constructor(options) {
                return this.initialize(options);
            },
            {
                /**
                 * Constructor
                 *
                 * @memberof ImageManager
                 * @param {Object} options for creating image
                 * @example
                 * var options = {
                 *     size: 10,
                 *     pool: {
                 *         crossOrigin: 'Anonymous'
                 *     },
                 *     cacheKey: '_'
                 * };
                 *     var manager = new ImageManager(options);
                 *
                 *
                 */
                initialize: function initialize(options) {
                    var size = (options && options.size) ? options.size : 0;
                    var pool = (options && options.pool) ? options.pool : {};
                    var cacheKey = (options && options.cacheKey) ? options.cacheKey : DEFAULT_CACHEKEY;
                    this.pool = new ImangePool(size, pool);
                    this.cacheKey = cacheKey;
                },

                /**
                 * Replaced by pixcelRatio of the URL $ {ratio}
                 *
                 * @memberof ImageManager
                 */
                imageUrl: function imageUrl(url) {
                    return url.replace('${ratio}', beez.utils.pixelRatio * 10);
                },

                /**
                 * Generate HTMLImageElement.
                 *
                 * It is returned when there is recyclable HTMLImageElement.
                 * release() is given to HTMLImageElement.
                 * Please call release () to always While destroying HTMLImageElement.
                 *
                 * @memberof ImageManager
                 * @param {Object} options for creating image
                 * @instance
                 */
                create: function create(options) {
                    return this.pool.create(options);
                },


                /**
                 * It is the number of HTMLImageElement(s) during use.
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                living: function living() {
                    return this.pool.living();
                },


                /**
                 * The total number of HTMLImageElement
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                peak: function peak() {
                    return this.pool.peak();
                },


                /**
                 * Waiting for reuse of HTMLImageElement
                 *
                 * @memberof ImageManager
                 * @instance
                 * @returns {int}
                 */
                waiting: function waiting() {
                    return this.pool.waiting();
                },


                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManager
                 * @instance
                 * @param {String|Array} url
                 * @param {Object|Array} options ex) Array: [{crossOrigin: "Anonymous"}, {crossOrigin: ""}]
                 * @return {ImageManagerAsync}
                 * @see ImageManagerAsync#load
                 */
                load: function load(url, options) {
                    return new ImageManagerAsync(this).load(url, options);
                },


                /**
                 * Load the image(s).
                 *
                 * @memberof ImageManager
                 * @instance
                 * @param {String} url
                 * @param {Object} options
                 * @return {ImageManagerAsync}
                 * @see ImageManagerAsync#loadOne
                 */
                loadOne: function loadOne(url, options) {
                    return new ImageManagerAsync(this).loadOne(url, options);
                },

                /**
                 * dispose this ImageManagerAsync
                 *
                 * @memberof ImageManager
                 * @instance
                 * @private
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    this.pool.dispose();
                    delete this.pool;
                    delete this.cacheKey;
                }
            }
        );

        return {
            ImageManager: ImageManager,
            ImageManagerAsync: ImageManagerAsync
        };
    });
})(this);
