
/**
 * @name base.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define('beez-mvcr/jsonpath',['require','exports','module','beez.core'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = beez.vendor._;

        // -------------------
        // JSONPath

        var cache = {}; // -- jsonpath implements


        /* JSONPath 0.8.0 - XPath for JSON
         *
         * Copyright (c) 2007 Stefan Goessner (goessner.net)
         * Licensed under the MIT (MIT-LICENSE.txt) licence.
         *
         * @license https://github.com/s3u/JSONPath
         */
        var jsonPath = function jsonPath(obj, expr, arg, testManaged) {
            var P = {
                resultType: arg && arg.resultType || "VALUE",
                flatten: arg && arg.flatten || false,
                wrap: (arg && arg.hasOwnProperty('wrap')) ? arg.wrap : true,

                normalize: function (expr) {
                    if (cache[expr]) {
                        return cache[expr];
                    }

                    var subx = [];
                    var ret =
                            expr.replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
                                return "[#" + (subx.push($1) - 1) + "]";
                            })
                            .replace(/'?\.'?|\['?/g, ";")
                            .replace(/;;;|;;/g, ";..;")
                            .replace(/;$|'?\]|'$/g, "")
                            .replace(/#([0-9]+)/g, function ($0, $1) {
                                return subx[$1];
                            });

                    cache[expr] = ret;
                    return ret;
                },
                asPath: function (path) {
                    var x = path.split(";"), p = "$";
                    for (var i = 1, n = x.length; i < n; i++) {
                        p += /^[0-9*]+$/.test(x[i]) ?
                            ("[" + x[i] + "]") : ("['" + x[i] + "']");
                    }
                    return p;
                },
                store: function (p, v) {
                    if (p) {
                        if (P.resultType === "PATH") {
                            P.result[P.result.length] = P.asPath(p);
                        } else {
                            if (_.isArray(v) && P.flatten) {
                                if (!P.result) { P.result = []; }
                                if (!_.isArray(P.result)) { P.result = [P.result]; }
                                P.result = P.result.concat(v);
                            } else {
                                if (P.result) {
                                    if (!_.isArray(P.result)) {
                                        P.result = [P.result];
                                    }

                                    if (_.isArray(v) && P.flatten) {
                                        P.result = P.result.concat(v);
                                    } else {
                                        P.result[P.result.length] = v;
                                    }
                                } else {
                                    P.result = v;
                                }
                            }
                        }
                    }
                    return !!p;
                },
                trace: function (expr, val, path) {

                    if (expr) {
                        var x = expr.split(";"), loc = x.shift();
                        x = x.join(";");
                        if (val && val.hasOwnProperty(loc)) {
                            P.trace(x, val[loc], path + ";" + loc);
                        } else if (loc === "*") {
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                P.trace(m + ";" + x, v, p);
                            });
                        } else if (loc === "..") {
                            P.trace(x, val, path);
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                typeof v[m] === "object" &&
                                    P.trace("..;" + x, v[m], p + ";" + m);
                            });
                        } else if (/,/.test(loc)) { // [name1,name2,...]
                            for (
                                var s = loc.split(/'?,'?/), i = 0, n = s.length;
                                i < n;
                                i++
                            ) {
                                P.trace(s[i] + ";" + x, val, path);
                            }
                        } else if (/^\(.*?\)$/.test(loc)) {// [(expr)]
                            /* jshint evil: true */
                            P.trace(
                                P.evaluate(
                                    loc, val, path.substr(path.lastIndexOf(";") + 1)
                                ) + ";" + x, val, path);
                        } else if (/^\?\(.*?\)$/.test(loc)) {// [?(expr)]
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                /* jshint evil: true */
                                if (P.evaluate(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) {
                                    P.trace(m + ";" + x, v, p);
                                }
                            });
                        } else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) {
                            // [start:end:step]  phyton slice syntax
                            P.slice(loc, x, val, path);
                        }
                    } else {
                        if (val && (_.isArray(val) || testManaged(val))) {
                            P.store(path, val);
                        }
                    }
                },
                walk: function (loc, expr, val, path, f) {
                    if (val instanceof Array) {
                        for (var i = 0, n = val.length; i < n; i++) {
                            if (i in val) {
                                f(i, loc, expr, val, path);
                            }
                        }
                    }
                    else if (typeof val === "object") {

                        //
                        // check if the object is managing object
                        // to avoid walking non-beez structure object
                        // added by maginemu
                        //
                        if (testManaged(val)) {
                            for (var m in val) {
                                if (val.hasOwnProperty(m)) {
                                    f(m, loc, expr, val, path);
                                }
                            }
                        }
                    }
                },
                slice: function (loc, expr, val, path) {
                    if (val instanceof Array) {
                        var len = val.length, start = 0, end = len, step = 1;
                        loc.replace(
                                /^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g,
                            function ($0, $1, $2, $3) {
                                start = parseInt($1 || start, 10);
                                end = parseInt($2 || end, 10);
                                step = parseInt($3 || step, 10);
                            }
                        );
                        start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                        end   = (end < 0)   ? Math.max(0, end + len)   : Math.min(len, end);
                        for (var i = start; i < end; i += step) {
                            P.trace(i + ";" + expr, val, path);
                        }
                    }
                },
                evaluate: function (x, _v, _vname) {
                    /* jshint evil: true */
                    try {
                        return $ && _v && eval(x);
                    } catch (e) {
                        throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/\^/g, "_a"));
                    } // `@` usecase removed from original
                }
            };
            P.result = P.wrap === true ? [] : undefined;

            var $ = obj;
            if (expr && obj && (P.resultType === "VALUE" || P.resultType === "PATH")) {
                P.trace(
                    P.normalize(expr).replace(/^\$;/, ""),
                    obj,
                    "$"
                );
                if (!_.isArray(P.result) && P.wrap) { P.result = [P.result]; }
                return P.result ? P.result : false;
            }
            return undefined;
        };

        return jsonPath;
    });

})(this);

/**
 * @name base.js<beez-mvcr>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp">
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define('beez-mvcr/base',['require','exports','module','beez.core','beez-mvcr/jsonpath'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = beez.vendor._;

        var jsonPath = require('beez-mvcr/jsonpath');

        var logger = beez.getLogger('beez.mvcr.base');

        // -------------------
        // ManagerBase

        /**
         * It provides a set of methods to deal with it and tree structure simple of Object.
         * Object of ManagerBase has properties of specific management
         *
         * @class
         * @name ManagerBase
         *
         * @example
         * var manager = new ManagerBase('idx');
         *
         * manager.add('/', {idx:'someObj'});
         * manager.get('/someObj') // => {idx:'someObj'}
         *
         * manager.add('/', [{idx:'button', name:'a'}, {idx:'button', name:'b'}]);
         * manager.get('/button') // => [{idx:'button', name:'a'}, {idx:'button', name:'b'}]
         * manager.get('/button[0]') // => {idx:'button', name:'a'}
         */
        var ManagerBase = beez.extend(
            'beez.manager.ManagerBase',
            function ManagerBase() {},
            {

                /**
                 * @constructor
                 * @memberof ManagerBase
                 * @param {String} idxProp base index name
                 */
                constructor: function constructor(idxProp) {

                    /**
                     * Objects that are managed
                     */
                    this.objs = {};

                    /**
                     * The assignment to the $ indicates the root
                     */
                    this.objs[idxProp] = '$';

                    /**
                     * Index for management
                     */
                    this._idxProp = idxProp || '';

                    /**
                     * Run initialize
                     */
                    this.initialize.apply(this, arguments);
                },

                /**
                 * Constructor
                 *
                 * @memberof ManagerBase
                 */
                initialize: function initialize() {},

                /**
                 * Get idx of object
                 *
                 * @memberof ManagerBase
                 * @param {ManagerBase} obj
                 * @public
                 * @returns {String} idx
                 */
                getIdx: function getIdx(obj) {
                    return obj[this._idxProp];
                },


                /**
                 * put under control the specified Object
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} prefix
                 * @param {Object|Array<Object>} obj
                 *
                 * @example
                 * var mainModel = {
                 *   follower: [
                 *     followerModel1,
                 *     folloewrModel2
                 *   ]
                 * }
                 *
                 * var followerModel3, followingModel, buttonModel;
                 * followerModel3.midx = 'follower';
                 * followingModel.midx = 'following';
                 * buttonModel.midx = 'button';
                 *
                 * manager.model.add('/main', [followerModel, followingModel]);
                 *
                 * -> mainModel : {
                 *   follower:[
                 *     followerModel1
                 *     folloewrModel2,
                 *     folloewrModel3
                 *   ],
                 *   following:[
                 *     followingModel
                 *   ]
                 * }
                 *
                 * manager.model.add('/main', button);
                 * -> mainModel : {
                 *   follower:[
                 *     followerModel1,
                 *     folloewrModel2,
                 *     folloewrModel3
                 *   ],
                 *   following:[
                 *     followingModel
                 *   ],
                 *   button: buttonModel
                 * }
                 */
                add: function add(prefix, obj) {
                    var parent = this.get(prefix); // search parent from root object

                    // get parent or create waiting object
                    if (!parent) { throw new beez.Error('no parent exists. path: ' + prefix); }
                    if (_.isArray(parent)) { throw new beez.Error('parent is Array. Specify one by using `[number]` selector. parent: ' + parent); }

                    if (_.isArray(obj)) { // add as the children
                        _.each(obj, function (_obj) {
                            _obj.prefix = prefix; // keep prefix
                            var idx = this.getIdx(_obj);
                            if (!parent[idx]) { // make array
                                parent[idx] = [];
                            }
                            parent[idx].push(_obj);

                        }, this);
                    } else {
                        obj.prefix = prefix; // keep prefix
                        var idx = this.getIdx(obj);
                        if (parent[idx]) {
                            throw new beez.Error(
                                'Obj: adding object to same parent with same index. Add obj as Array to add several objs into same index. idx: ' + this.getIdx(obj));
                        }
                        parent[idx] = obj;
                    }

                    return this;
                },


                /**
                 * will remove from management the object that is specified in the path
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} path
                 */
                remove: function remove(path) {
                    var objs = this.get(path);
                    // get all children
                    var children = [];
                    var deletes;

                    if (!objs) { return; }

                    // now `views` is always Array
                    if (!_.isArray(objs)) { objs = [objs]; } // array-nize

                    _.each(objs, function (v) {
                        var c = this.getChildrenAll(v);
                        children = children.concat(c);
                    }, this);

                    // list to delete
                    // is children and this views
                    deletes = children.concat(objs);
                    // remove parent's reference
                    _.each(deletes, function (del) {
                        this.deleteFromParent(del);
                    }, this);

                    // call dispose of each views
                    _.each(deletes, function (v) {
                        //v.remove();
                        v.dispose && v.dispose();
                    });
                },

                /**
                 * Returns whether the object can be added to the manager.
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object} obj
                 * @returns {boolean}
                 */
                isAddable: function (obj) {
                    return !!this.getIdx(obj);
                },


                /**
                 * get an Object that is specified in the path
                 * Warnning: which was replaced by the '/' '.'.
                 *           no need for root $
                 *
                 * @see https://github.com/s3u/JSONPath
                 * @memberof ManagerBase
                 * @instance
                 * @param {String} path
                 * @returns {Object}
                 */
                get: function get(path) {
                    if (path === undefined || typeof(path) !== 'string') {
                        return undefined;
                    }

                    if (/^\/$/.test(path)) {
                        return this.objs;
                    }

                    var self = this;
                    path = '$' + path.replace(/\//g, '.');
                    var result = jsonPath(
                        this.objs,
                        path,
                        {wrap: false},
                        function testAddable(obj) {
                            return self.isAddable(obj);
                        });
                    if (!result) {
                        return undefined;
                    }
                    return result;
                },


                /**
                 * get the parent. If obj is an array: I get the information from the parent of the first element
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object|Array.<Object>} obj
                 */
                getParent: function getParent(obj) {
                    if (_.isArray(obj)) {
                        return this.get(obj[0].prefix);
                    }
                    return this.get(obj.prefix);
                },


                /**
                 * will remove from the parent, a reference to objct specified.
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object|Array.<Object>} obj
                 */
                deleteFromParent: function deleteFromParent(obj) {
                    if (!obj) {
                        return;
                    }

                    var parent = this.getParent(obj);
                    if (_.isArray(obj)) {
                        delete parent[this.getIdx(obj[0])];
                    } else {
                        delete parent[this.getIdx(obj)];
                    }
                },


                /**
                 * get the child list of just under
                 *
                 * @memberof ManagerBase
                 * @instance
                 * @param {Object} obj
                 * @return {Array.<Object>}
                 */
                getChildren: function getChildren(obj) {
                    var result = [];
                    var self = this;

                    var _walk = function _walk(list) {
                        _.each(list, function (item) {
                            if (!item) {
                                return;
                            }

                            if (_.isArray(item)) {
                                _walk(item);
                            } else if (self.getIdx(item)) {
                                result.push(item);
                            }
                        });
                    };

                    _walk(obj);
                    return result;
                },


                /**
                 * You get as an array all the specified Object (recursively)
                 *
                 * @memberof ManagerBase
                 * @param {Object} data
                 * @return {Array.<Object>}
                 */
                getChildrenAll: function getChildrenAll(data) {
                    var result = [];
                    var self = this;

                    var _walk = function _walk(obj) {
                        var list = obj;
                        if (!_.isArray(obj)) {
                            list = _.values(obj);
                        }
                        _.each(list, function (item, idx) {
                            if (!item) {
                                return;
                            }
                            if (_.isArray(item)) {
                                _walk(item);

                            } else if (self.getIdx(item)) {

                                if (!item.prefix || !item.manager) { // Item that is not managed to ignore
                                    logger.warn("Manager ignore the Object haven't been manaegd.", item);
                                    // result.push(item); // Do not ignore
                                    return;
                                }

                                // Ignore the member variable Object has set manually by user.
                                if (obj[self._idxProp] !== '$' && !_.isArray(obj) && item.getParent()[self._idxProp] !== obj[self._idxProp]) {
                                    logger.warn("Manager ignore the Object haven't been manaegd.",
                                                'Path that is managed:', self.pathOf(item), // The paths managed the Object of interest
                                                'Path to the specified:', self.pathOf(obj) // The actual path
                                                );
                                    return;
                                }
                                _walk(item); // Child is at the beginning of the Array
                                result.push(item);

                            }
                        });
                    };

                    // walk start
                    _walk(data);
                    return result;
                },


                /**
                 * Returns the path of the Object being managed. If the Object is array, returns the first element.
                 *
                 * @memberof ManagerBase
                 * @param {String} prefix
                 * @param {Object|Array} obj
                 * @throw {Error} obj is empty array
                 * @throw {Error} object.prefix does not exist
                 * @return {String}
                 */
                pathOf: function pathOf(obj) {
                    var prefix = '';
                    if (_.isArray(obj)) {
                        if (_.isEmpty(obj)) {
                            throw new beez.Error('pathOf: obj is empty array.');
                        }
                        obj = obj[0];
                    }

                    prefix = obj.prefix;

                    if (!prefix) {
                        throw new beez.Error('pathOf: object.prefix does not exist.');
                    }
                    return prefix + ((/^\/$/.test(prefix)) ? '' : '/') + this.getIdx(obj);
                },


                /**
                 * Returns the information Objects are managed.
                 *
                 * @memberof ManagerBase
                 * @return {Object}
                 */
                trace: function trace() {

                    var pairs = {};

                    // all children
                    var all = this.getChildrenAll(this.objs || {});

                    // for each child, make path & store
                    var self = this;
                    _.each(all, function (obj) {

                        if (!obj) {
                            return;
                        }

                        // make path
                        var key;
                        if (obj.prefix === '/') { // if parent is root
                            key = obj.prefix + self.getIdx(obj);
                        } else {
                            key = obj.prefix + '/' + self.getIdx(obj);
                        }

                        // store
                        if (pairs[key]) { // if already exists
                            if (!_.isArray(pairs[key])) {
                                // at first time, make array
                                pairs[key] = [pairs[key]];
                            }
                            pairs[key].push(obj); // push
                        } else {
                            // as sigle object
                            pairs[key] = obj;
                        }
                    });

                    return pairs;
                },
                dispose: function dispose() {
                    delete this.objs;
                    delete this._idxProp;
                }
            }
        );

        // -------------------
        // Base

        /**
         * This is the base class of an Object managed by the Manager.
         *
         * @class
         * @name Base
         */
        var Base = beez.extend(
            'beez.mvcr.Base',
            function Base() {},
            {
                /**
                 * get the first element. Gets the parent. If object is an array, sets the first
                 *
                 * @memberof Base
                 * @instance
                 */
                getParent: function getParent() {
                    return this.manager.getParent(this);
                },

                /**
                 * delete the reference of Object from a parent
                 *
                 * @memberof Base
                 * @instance
                 */
                deleteFromParent: function deleteFroParent() {
                    return this.manager.deleteFromParent(this);
                },

                /**
                 * I acquire a list of children underneath.
                 *
                 * @memberof Base
                 * @instance
                 * @return {Array.<Object>}
                 */
                getChildren: function getChildren() {
                    return this.manager.getChildren(this);
                },

                /**
                 * I acquire all Object of the descendant as an arrangement.
                 *
                 * @memberof Base
                 * @instance
                 * @return {Array.<Object>}
                 */
                getChildrenAll: function getChildrenAll() {
                    return this.manager.getChildrenAll(this);
                },


                /**
                 * Sets the object beneath the specified prefix.
                 *
                 * @memberof Base
                 * @param {String} prefix prefix name
                 */
                alias: function alias(prefix) {
                    return this.manager.add(prefix, this);
                }
            }
        );

        return {
            ManagerBase: ManagerBase,
            Base: Base
        };

    });

})(this);

/**
 * @fileOverview Model
 * @name model.js<beez-mvcr>
 * @author Kazuma Mishimagi <mishimagi_kazuma@cyberagent.co.jp>
 * @overview Model management functions
 */

(function (global) {

    /**
     * Model module
     * @exports beez-mvcr/model
     */
    define('beez-mvcr/model',['require','exports','module','beez.core','backbone','beez-mvcr/base'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = beez.vendor._;
        var Backbone = require('backbone');
        var $ = beez.vendor.$;

        var base = require('beez-mvcr/base');
        var Base = base.Base;
        var ManagerBase = base.ManagerBase;

        var logger = beez.getLogger('beez.mvcr.model');

        // -------------------
        // ModelManagerAsync

        /**
         * Model management class. asynchronous
         *
         * @class
         * @name ModelManagerAsync
         * @extends {Bucks}
         */
        var ModelManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ModelManagerAsync',
            {
                initialize: function initialize(manager) {
                    this.manager = manager;
                    this.current = undefined;
                    this.root = undefined;
                },

                /**
                 * set root
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                //root: function root(RootView) {
                //var self = this;
                //    return this.then(function () {
                //        return self.manager.root(RootView);
                //    });
                //},

                /**
                 * Generate Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Model|Array<Model>} Model Generate model object.
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {ModelManagerAsync}
                 */
                create: function create(prefix, Model, attributes, options) {
                    var self = this;
                    return this.then(function () {
                        var v = self.manager.create(prefix, Model, attributes, options);
                        self.root = self.current = v;
                        self.create = function create_twice() {
                            throw new beez.Error('create called more than once!');
                        };
                        return v;
                    });
                },

                /**
                 * Generate collection.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {String} prefix
                 * @param {Collection|Array<Model>} Collection Generate collection object.
                 * @param {Array<Object>} models Model(s)
                 * @param {Object|Array<Object>} options Collection to generate a options
                 * @return {ModelManagerAsync}
                 */
                createCollection: function createCollection(prefix, Collection, models, options) {
                    var self = this;
                    return this.then(function () {
                        var c = self.manager.createCollection(prefix, Collection, models, options);
                        self.root = self.current = c;
                        self.createCollection = function createCollection_twice() {
                            throw new beez.Error('create called more than once!');
                        };
                        return c;
                    });
                },

                /**
                 * Get the child Model
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {Model|Array<Model>} Model Generate model object.
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {ModelManagerAsync}
                 */
                child: function child(Model, attributes, options) {
                    var self = this;
                    return this.then(function () {
                        if (!self.root) {
                            throw new beez.Error('No chain root exists. `create` first.');
                        }
                        var prefix = self.manager.pathOf(self.current);
                        var v = self.manager.create(prefix, Model, attributes, options);
                        self.current = _.isArray(v) ? v[0] : v;
                    });
                },

                /**
                 * I acquire a parent of Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                parent: function parent() {
                    var self = this;
                    return this.then(function () {
                        self.current = self.manager.getParent(self.current);
                        if (!self.current) {
                            throw new beez.Error('get parent failed');
                        }
                    });
                },


                /**
                 * The child and its brother of the parents of Model.
                 *
                 * @memberof ModelManagerAsync
                 * @instance
                 * @param {Model|Array<Model>} brother object.
                 * @param {Object|Array<Object>} [attributes] constructor a attributes
                 * @param {Object|Array<Object>} [options] constructor a options
                 * @return {ModelManagerAsync}
                 */
                bro: function bro(brother, attributes, options) {
                    return this.parent().child(brother, attributes, options);
                },


                /**
                 * Disposes of the instance
                 *
                 * @override
                 * @memberof ModelManagerAsync
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.manager;
                    delete this.current;
                    if (this.root && this.root.dispose) {
                        this.root.dispose();
                    }
                    delete this.root;
                }
            }
        );


        // -------------------
        // ModelManager

        /**
         * ModelManager Class
         *
         * @class
         * @name ModelManager
         */
        var ModelManager = beez.extend(
            'beez.mvcr.ModelManager',
            ManagerBase,
            {
                /**
                 * Constructor
                 *
                 * @memberof ModelManager
                 */
                initialize: function initialize() {
                    var self = this;

                    ModelManager.__super__.initialize.apply(this, arguments);

                    // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
                    // Override this if you'd like to use a different library.
                    //beez.vendor.Backbone.ajax = this.ajax;

                    this._sync = beez.vendor.Backbone.sync;
                    beez.vendor.Backbone.sync = function sync(method, model, options) {
                        var configAjax = beez.config.ajax || {};
                        _.defaults(options || (options = {}), configAjax, {
                            dataType: 'json',
                            contentType: 'application/json',
                            emulateHTTP: false,
                            emulateJSON: false
                        });
                        self._sync.apply(this, arguments);
                    };
                },

                /**
                 * Generating ModelManagerAsync
                 *
                 * @memberof ModelManager
                 * @instance
                 * @return {ModelManagerAsync}
                 */
                async: function async() {
                    return new ModelManagerAsync(this);
                },

                /**
                 * Set the Root Model
                 *
                 * @memberof ModelManager
                 * @param {Model} RootModel
                 * @return {Model}
                 */
                root: function root(RootModel) {
                    var rootModel = new RootModel(this);
                    var root = this.get('/@');
                    if (root) {
                        throw new beez.Error('root already exists!');
                    }

                    if (rootModel.midx !== '@') {
                        throw new beez.Error('roots midx must be "@"');
                    }
                    this.add('/', rootModel);

                    return rootModel;
                },

                /**
                 * Generate Model. Add a managed object
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {String} prefix parent prefix.
                 * @param {Model|Array<Model>} Model Generate model object(s).
                 * @param {Object|Array<Object>} [attributes] Model to generate a attributes
                 * @param {Object|Array<Object>} [options] Model to generate a options
                 * @return {Model}
                 */
                create: function create(prefix, Model, attributes, options) {

                    if (!Model || (!_.isArray(Model) && typeof Model !== 'function')) {
                        var msg = 'Model does not exist / does not be funciton. ' + 'Specified prefix: ' + prefix;
                        throw new beez.Error(msg);
                    }

                    if (Model instanceof Collection) {
                        throw new beez.Error('Collection specified.  Use #createCollection instead.');
                    }

                    if (!prefix) { // prefix check
                        throw new beez.Error('No prefix specified. Creating:' + Model.name);
                    } else if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + Model.name);
                    }

                    if (!this.get(prefix)) { // no parent
                        throw new beez.Error('no parent exists. prefix: ' + prefix + ' ,  Please consider constructing in Controller and so on.');
                    }

                    if (_.isArray(Model)) {
                        return this._createArray(prefix, Model, attributes, options);
                    }

                    return this._createObj(prefix, Model, attributes, options);
                },

                _createObj: function _createObj(prefix, Model, attribute, option) {
                    var m = new Model(attribute, option, this);

                    if (!this.isAddable(m)) {
                        throw new beez.Error('index does not exists in the Model. :' + m);
                    }
                    this.add(prefix, m);

                    return m;
                },

                _createArray: function _createArray(prefix, Models, attributes, options) {
                    // make to array when params aren't array
                    if (attributes && !_.isArray(attributes)) {
                        attributes = [attributes];
                    }

                    if (options && !_.isArray(options)) {
                        options = [options];
                    }
                    var self = this;
                    var instances = [];
                    _.each(Models, function (C, idx) {
                        var attr = attributes ? attributes[idx] : undefined;
                        var opt = options ? options[idx] : undefined;
                        instances.push(new C(attr, opt, self));
                    });

                    _.each(instances, function (model) {
                        if (!this.isAddable(model)) {
                            throw new beez.Error('index does not exist in the Model. :' + model);
                        }
                    }, this);

                    this.add(prefix, instances);

                    return instances;
                },

                /**
                 * Generate collection.
                 *
                 * @memberof ModelManager
                 *
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {Collection} Collection Generate collection object.
                 * @param {Object} [attributes] Collection to generate a attributes
                 * @param {Object} [options] Collection to generate a options
                 * @return {Model}
                 */
                createCollection: function createCollection(prefix, Collection, models, options) {
                    if (!Collection || typeof Collection !== 'function') {
                        var msg = 'Collection does not exist / does not be funciton. ' +
                                'Specified prefix: ' + prefix;
                        throw new beez.Error(msg);
                    }

                    if (!prefix) { // prefix check
                        throw new beez.Error('No prefix specified. Creating:' + Collection.name);
                    }
                    if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + Collection.name);
                    }

                    var c = new Collection(models, options, this);

                    this.add(prefix, c);

                    return c;
                },

                _newAll: function _newAll(ctor, attributes, options) {

                    if (!ctor) {
                        throw new beez.Error('ctor does not exist.');
                    }

                    if (!_.isArray(ctor)) {
                        ctor = [ctor];
                    }

                    if (attributes && !_.isArray(attributes)) {
                        attributes = [attributes];
                    }

                    if (options && !_.isArray(options)) {
                        options = [options];
                    }


                    var instances = [];
                    _.each(ctor, function (C, idx) {
                        var attrs = attributes ? attributes[idx] : undefined;
                        var opts = options ? options[idx] : undefined;
                        instances.push(new C(attrs, opts));
                    });

                    return instances;
                },

                /**
                 * _decideDeleteModel
                 *
                 * @memberof ModelManager
                 * @instance
                 * @private
                 * @param {Object} obj
                 * @return Array
                 */
                _decideDeleteModel: function _decideDeleteModel(obj) {
                    var deletes = [];

                    if (!_.isArray(obj)) {
                        obj = [obj];
                    }

                    _.each(obj, function (m) {
                        deletes = deletes.concat(m.getChildrenAll());
                    }, this);
                    deletes = deletes.concat(obj);

                    return deletes;
                },

                /**
                 * model or collection specified by path is canceled and it removes from management. delete the descendants.
                 * If the binding is not removed. If the reference may be state without properly.
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {String} path
                 * @param {Object} options @see backbone.js#Collection.remove()
                 */
                remove: function remove(path, options) {
                    var objs = this.get(path);
                    if (!objs) {
                        logger.debug('Path of unmanaged become subject to deletion, I was skipped. path:', path);
                        return this;
                    }

                    logger.debug(this.constructor.name, 'remove. path:', path);

                    if (objs.isCollection()) {

                        objs.removeAll && objs.removeAll(options);
                        this.deleteFromParent(objs);
                        objs.dispose();

                        return this;
                    }

                    var deletes = this._decideDeleteModel(objs),
                        binding;

                    _.each(deletes, function (d) {
                        d.beforeDispose && d.beforeDispose();
                    });

                    binding = _.reduce(deletes, function (list, d) {
                        if (d.isBinded()) {
                            list.push(d.cid);
                        }
                        return list;
                    }, []);

                    if (!_.isEmpty(binding)) {
                        throw new beez.Error('a disposing model have some bindings. models cid: [' + binding.join(', ') + ']');
                    }

                    _.each(deletes, function (d) {
                        this.deleteFromParent(d);
                        d.dispose && d.dispose();
                    }, this);

                    return this;
                },

                /**
                 * Supports asynchronous communication.
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                ajax: function ajax(options) {
                    var method = options.type;
                    var configAjax = beez.config.ajax || {};
                    var urlRoot = beez.config.url && beez.config.url.api;
                    _.defaults(options || (options = {}), configAjax, {
                        dataType: 'json',
                        contentType: 'application/json',
                        emulateHTTP: false,
                        emulateJSON: false,
                        urlRoot: urlRoot || ''
                    });

                    if (!/^(http|https):\/\//.test(options.url)) {
                        options.url = options.urlRoot + options.url;
                    }

                    if (options.data && options.contentType &&  options.contentType.indexOf('application/json') === 0 && _.isObject(options.data)) {
                        options.data = JSON.stringify(options.data);
                    }

                    if (options.emulateJSON) {
                        options.contentType = 'application/x-www-form-urlencoded';
                    }

                    if (options.type !== 'GET' && !options.emulateJSON) {
                        options.processData = false;
                    }

                    if (options.emulateHTTP && (method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
                        options.type = 'POST';
                        if (options.emulateJSON) {
                            options.data._method = method;
                        }
                        var beforeSend = options.beforeSend;
                        options.beforeSend = function (xhr, settings) {
                            if (options.emulateHTTP && (method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
                                if (!!settings.headers) {
                                    settings.headers['X-HTTP-Method-Override'] = method;
                                } else {
                                    xhr.setRequestHeader('X-HTTP-Method-Override', method);
                                }
                            }
                            if (beforeSend) {
                                beforeSend.apply(null, arguments);
                            }
                        };
                    }

                    return $.ajax.call(null, options);
                },

                /**
                 * Supports asynchronous communication.
                 * http method: GET
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                $get: function (options) {
                    _.extend(options || (options = {}), { type: 'GET' });
                    return this.ajax(options);
                },

                /**
                 * Supports asynchronous communication.
                 * http method: POST
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                $post: function (options) {
                    _.extend(options || (options = {}), { type: 'POST' });
                    return this.ajax(options);
                },

                /**
                 * Supports asynchronous communication.
                 * http method: PUT
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                $put: function (options) {
                    _.extend(options || (options = {}), { type: 'PUT' });
                    return this.ajax(options);
                },

                /**
                 * Supports asynchronous communication.
                 * http method: DELETE
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                $delete: function (options) {
                    _.extend(options || (options = {}), { type: 'DELETE' });
                    return this.ajax(options);
                },

                /**
                 * Supports asynchronous communication.
                 * http method: PATCH
                 *
                 * @memberof ModelManager
                 * @instance
                 * @param {Object} options
                 */
                $patch: function (options) {
                    _.extend(options || (options = {}), { type: 'PATCH' });
                    return this.ajax(options);
                },

                /**
                 * Dispose self instance and models belong to.
                 *
                 * @name dispose
                 * @memberof ModelManager
                 * @instance
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');

                    var managedChildren = this.getChildrenAll(this.objs);

                    _.each(managedChildren, function (key) {
                        key.dispose();
                    });

                    delete this.urlRoot;
                    delete this._sync; // Backbone.sync

                    ModelManager.__super__.dispose.apply(this, arguments);
                }
            }
        );

        /**
         * Model Class. asynchronous
         * @class
         * @name ModelAsync
         */
        var ModelAsync = beez.Bucks.extend(
            'beez.mvcr.ModelAsync',
            {

                initialize: function initialize(model) {
                    this.model = model;
                },

                /**
                 * From the data source and retrieve data.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#fetch
                 */
                fetch: function fetch(options) {

                    var model = this.model;
                    return this.then(function waitCb(res, next) {
                        options = options ? _.clone(options) : {};

                        options.success = function (model, res) {
                            next(null, {model: model, res: res});
                        };
                        options.error = function (model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };
                        model.fetch(options);
                    });
                },

                /**
                 * Update the data in the data source.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#save
                 */
                save: function save(key, val, options) {
                    /* jshint eqeqeq: false, eqnull: true */
                    var attrs;

                    // Handle both `"key", value` and `{key: value}` -style arguments.
                    if (key == null || _.isObject(key)) {
                        attrs = key;
                        options = val;
                    } else if (key != null) {
                        (attrs = {})[key] = val;
                    }

                    var model = this.model;
                    return this.then(function waitCb(res, next) {

                        options = options ? _.clone(options) : {};

                        options.success = function success(model, res) {
                            next(null, {model: model, res: res});
                        };

                        options.error = function error(model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };

                        model.save(attrs, options);
                    });
                },

                /**
                 * Delete the data in the data source.
                 *
                 * @memberof ModelAsync
                 * @instance
                 * @see Backbone.Model#destroy
                 */
                destroy: function destroy(options) {

                    var model = this.model;
                    return this.then(function waitCb(res, next) {
                        options = options ? _.clone(options) : {};

                        options.success = function success(model, res) {
                            next(null, {model: model, res: res});
                        };

                        options.error = function error(model, res) {
                            next(new Error(JSON.stringify({model: model, res: res, options: options})));
                        };

                        model.destroy(options);
                    });
                },

                /**
                 * dispose this chain
                 * @memberof ModelAsync
                 * @instance
                 * @private
                 * @override
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.model;
                }
            }
        );


        // -------------------
        // Model

        /**
         * Model class.
         *
         * @constructor
         * @name Model
         * @extends {Backbone.Model}
         * @see Backbone.Model
         */
        var Model = beez.extend(
            'beez.mvcr.Model',
            Base,
            Backbone.Model.prototype,
            /**
             * @lends module:beez-mvcr/model~Model.prototype
             */
            {
                /**
                 * @memberof Model
                 */
                constructor: function constructor(attribute, options, manager) {
                    var args = Array.prototype.slice.call(arguments);

                    options = options || {};
                    // data source access root url.
                    var _urlRoot = '';
                    if (options.urlRoot) {
                        _urlRoot = options.urlRoot;
                    } else if (beez.config && beez.config.url) {
                        _urlRoot = beez.config.url.api || '';
                    }
                    options.urlRoot = _urlRoot;

                    _.extend(this, _.pick(options, ['urlRoot']));

                    // Model's constructor.
                    if ((args.length === 1 && args[0].objs) ||
                        (args.length === 2 && args[1].objs) ||
                        (args.length === 3 && args[2].objs)) {

                        this.manager = args[args.length - 1];

                        if (args.length === 1) {
                            attribute = null;
                        }

                    }

                    if (!this.manager) {
                        logger.debug("Manager can't be managed this model.");
                    }
                    // call Backbone.constructor
                    //
                    // Warning: `Model.__supersuper__.constructor` can't use in here.
                    // Because `Backbone.Model.constructor` call `Backbone.Medel.
                    // initialize`, so call `Backbone.Model.constructor` directory.
                    Model.__super__.constructor.call(this, attribute, options);
                },

                /**
                 * call initialize method
                 *
                 * @memberof Model
                 * @name initialize
                 * @override Backbone.Model.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.Model.initialize
                    Model.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for Model management.
                 *
                 * @memberof Model
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,

                /**
                 * Generating ModelAsync
                 *
                 * @memberof Model
                 * @instance
                 * @return {ModelAsync}
                 */
                async: function async() {
                    return new ModelAsync(this);
                },

                /**
                 * Collection Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isCollection: function isCollection() {
                    return false;
                },

                /**
                 * Model Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isModel: function isModel() {
                    return true;
                },

                /**
                 * Binding exists
                 *
                 * @memberof Model
                 * @instance
                 * @return {boolean}
                 */
                isBinded: function isBinded() {
                    if (this._events) {
                        var self = this,
                            list;
                        return _.some(this._events, function (evt) {
                            list = _.reject(evt, function (binding) {
                                return binding.context === self;
                            });
                            return list.length > 0;
                        });
                    }
                    return false;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof Model
                 * @instance
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');

                    delete this.manager;
                    delete this.cid;
                    delete this.attributes;
                    // delete this.url;
                    // delete this.urlRoot;
                    delete this.collection;

                    // Model.__super__.dispose.apply(this, arguments);
                },
                /**
                 * Do nothing but throw error.
                 *
                 * @name remove
                 * @function
                 * @memberof Model
                 * @instance
                 * @return Error
                 */
                remove: function remove() {
                    throw new beez.Error('Use Backbone.model.destroy() or Model.dipose() instead of this');
                }
            }
        );

        /**
         * @memberof Model
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @see {beez}
         * @example
         * var MyModel = Model.extend(
         *     'myapp.MyModel'
         *     {
         *         midx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        Model.extend = beez.extendThis;


        // -------------------
        // CollectionAsync

        /**
         * Collection class. asynchronous
         *
         * @class
         * @name ModelAsync
         * @extends {Bucks}
         */
        var CollectionAsync = beez.Bucks.extend(
            'beez.mvcr.CollectionAsync',
            {
                initialize: function initialize(collection) {
                    this.collection = collection;
                    //_.each(Collection.__superCtor__.prototype, function(obj, idx) {});
                },
                /**
                 * New collection
                 *
                 * @memberof CollectionAsync
                 * @instance
                 * @return {Collection}
                 */
                create: function create(model, options) {
                    var self = this;
                    return this.then(function () {
                        return self.collection.create(model, options);
                    });
                },
                /**
                 * Remove collection
v                 *
                 * @memberof CollectionAsync
                 * @instance
                 * @return {Collection}
                 */
                remove: function remove(models, options) {
                    var self = this;
                    return this.then(function () {
                        return self.collection.remove(models, options);
                    });
                },
                /**
                 * @override Backbone.Collection#_reset
                 * @see Backbone.Collection#_reset
                 * @memberof CollectionAsync
                 * @instance
                 */
                _reset: function () {
                    var self = this;
                    return this.then(function () {
                        return self.collection._reset();
                    });
                },

                /**
                 * Disposes of the instance
                 *
                 * @override
                 * @memberof CollectionAsync
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.collection;
                }
            }
        );


        // -------------------
        // Collection

        /**
         * Collection class.
         *
         * @constructor
         * @name Collection
         * @extends {Backbone.Collection}
         * @see Backbone.Collection
         */
        var Collection = beez.extend(
            Base,
            Backbone.Collection.prototype,
            {
                /**
                 * @memberof Collection
                 */
                constructor: function constructor(models, options, manager) {
                    /**
                     * default model
                     * @memberof Collection
                     * @type {Model}
                     */
                    if (!this.model) { this.model = Model; }

                    /**
                     * @override
                     * @memberof Collection
                     * @instance
                     */
                    this.urlRoot = (function urlRoot() {
                        var _urlRoot = '';
                        if (beez.config && beez.config.url) {
                            _urlRoot = beez.config.url.api || '';
                        }
                        return _urlRoot;
                    }());
                    // Collection's constructor.
                    this.manager = manager;
                    var newArgs = arguments;
                    if (3 <= arguments.length) {
                        newArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                    }
                    Collection.__super__.constructor.apply(this, newArgs);
                },

                /**
                 * call initialize method
                 *
                 * @memberof Collection
                 * @name initialize
                 * @override Backbone.Collection.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.Collection.initialize()
                    Collection.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for Model management.
                 *
                 * @memberof Collection
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,

                /**
                 * Generating Collection.
                 *
                 * @memberof Collection
                 * @instance
                 * @return {Collection}
                 */
                async: function async() {
                    return new CollectionAsync(this);
                },

                /**
                 * Collection Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isCollection: function isCollection() {
                    return true;
                },

                /**
                 * Model Object?
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isModel: function isModel() {
                    return false;
                },

                /**
                 *
                 * @memberof Collection
                 * @override
                create: function create(model, options) {
                    options = options ? _.clone(options) : {};
                    if (!(model = this._prepareModel(model, options))) { return false; }
                    if (!options.wait) { this.add(model, options); }
                    var collection = this;
                    var success = options.success;
                    options.success = function (model, resp, options) {
                        if (options.wait) { collection.add(model, options); }
                        if (success) { success(model, resp, options); }
                    };
                    model.save(null, options);
                    return model;

                },
                 */

                /**
                 * Remove collection.
                 *
                 * @override
                 * @memberof Collection
                 * @param {Array|Object} models A Model list to delete
                 * @param {Object} options @see backbone.js#Collection.remove()
                 * @instance
                 */
                remove: function remove(models, options) {
                    // call Backbone.remove()
                    Collection.__super__.remove.apply(this, arguments);

                    models = _.isArray(models) ? models.slice() : [models];

                    _.each(models, function (m) {
                        m.dispose && m.dispose();
                    });

                    return this;
                },

                /**
                 * All the Model(s) are deleted.
                 *
                 * @memberof Collection
                 * @param {Array|Object} models A Model list to delete
                 * @param {Object} options @see backbone.js#Collection.remove()
                 * @instance
                 */
                removeAll: function removeAll(options) {
                    return this.remove(this.models, options);
                },

                /**
                 * @override
                 * @memberof Collection
                 * @instance
                 */
                _reset: function () {
                    this.length = 0;
                    _.each(this.models, function (m) {
                        m.dispose && m.dispose();
                    });
                    this.models = [];
                    this._byId  = {};
                },

                /**
                 * Binding exists
                 *
                 * @memberof Collection
                 * @instance
                 * @return {boolean}
                 */
                isBinded: function isBinded() {
                    if (this._events) {
                        var self = this,
                            list;
                        return _.some(this._events, function (evt) {
                            list = _.reject(evt, function (binding) {
                                return binding.context === self;
                            });
                            return list.length > 0;
                        });
                    }
                    return false;
                },

                /**
                 * Disposes of the instance
                 * Please use remove() to perform dispose.
                 *
                 * @memberof Collection
                 * @instance
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');

                    _.each(this.models, function (m) {
                        m.dispose && m.dispose();
                    });

                    // delete this.urlRoot;
                    delete this.manager;
                    // delete this.url;
                    delete this.comparator;
                    delete this.length;
                    delete this.models;
                    delete this._byId;

                    // call Base.dispose()
                    // Collection.__super__.dispose.apply(this, arguments);
                }
            }
        );

        /**
         * @memberof Collection
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @see {beez}
         * @example
         * var MyCollection = Collection.extend(
         *     'myapp.MyCollection'
         *     {
         *         midx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        Collection.extend = beez.extendThis;

        return {
            Model: Model,
            Collection: Collection,
            ModelManager: ModelManager,
            ModelManagerAsync: ModelManagerAsync
            //manager: modelManager
        };

    });
})(this);

/**
 * @fileOverview BeezModic
 * @name modic.js<beez-mvcr>
 * @author Go Ohtani <otani_go@cyberagent.co.jp>
 */

(function (global) {

    /**
     * BeezModic module
     * @exports beez-mvcr/modic
     */
    define('beez-mvcr/modic',['require','exports','module','beez.core','backbone','beez-mvcr/model'],function (require, exports, module) {
        

        var beez = require('beez.core');
        var _ = beez.vendor._;
        var Backbone = require('backbone');

        var model = require('beez-mvcr/model');

        /**
         * Model without data source. (Logic Model)
         *
         * @constructor
         * @name Modic
         * @extends {beez.Modic}
         */
        var Modic = model.Model.extend(
            'beez.mvcr.Modic',
            /**
             * @lends module:beez-mvcr/model~Model.prototype
             */
            {

                /**
                 * Index for Model management.
                 *
                 * @memberof Modic
                 * @instance
                 * @property midx
                 * @type {String}
                 */
                midx: undefined,


                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 */
                lRoot: function urlRoot() {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 */
                url: function url() {
                    throw new beez.Error('not allowed to use this function.');
                },


                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 *
                 */
                async: function async() {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 */
                fetch: function fetch(options) {
                    throw new beez.Error('not allowed to use this function.');
                },

                /**
                 * @override
                 * @memberof Modic
                 * @instance
                 * @private
                 *
                 */
                save: function save(key, val, options) {
                    throw new beez.Error('not allowed to use this function.');
                }
            }
        );

        return {
            Modic: Modic
        };
    });
})(this);

/**
 * @fileOverview View
 * @name view.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {
    define('beez-mvcr/view',['require','exports','module','beez.core','beez.utils','backbone','beez-mvcr/base'],function __View__(require, exports, module) {
        

        var beez = require('beez.core');
        require('beez.utils');

        var _ = beez.vendor._;
        var Backbone = require('backbone');

        var base = require('beez-mvcr/base');
        var Base = base.Base;
        var ManagerBase = base.ManagerBase;

        var logger = beez.getLogger('beez.mvcr.view');


        /**
         * View management class, asynchronous
         *
         * @class
         * @name Creator
         * @extends {Bucks}
         */
        var ViewManagerAsync = beez.Bucks.extend(
            'beez.mvcr.ViewManagerAsync',
            {
                initialize: function initialize(manager) {
                    this.manager = manager;
                },

                /**
                 * set root
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {View} root vidx is '@' must
                 * @return {ViewManagerAsync}
                 */
                root: function root(root) {
                    var self = this;
                    return this.then(function () {
                        return self.manager.root(root);
                    });
                },

                /**
                 * Generate View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {View|Array<View>} View Generate View object(s).
                 * @param {Object} [options] Argument of the View object.
                 * @return {ViewManagerAsync}
                 */
                create: function create(prefix, View, options) {
                    var self = this;
                    return this.then(function () {
                        var v =  self.manager.create(prefix, View, options);
                        var current = _.isArray(v) ? v[0] : v;
                        return current;
                    });
                },

                /**
                 * View is generated as a child of the View object generated before the chain.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {View|Array<View>} View Generate View object.
                 * @param {Object} [options] Argument of the View object.
                 * @return {ViewManagerAsync}
                 */
                child: function child(View, options) {
                    var self = this;
                    return this.then(function (current) {
                        var prefix = self.manager.pathOf(current);
                        var v = self.manager.create(prefix, View, options);
                        current = _.isArray(v) ? v[0] : v;
                        return current;
                    });
                },

                /**
                 * Get the parent View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @return {ViewManagerAsync}
                 */
                parent: function parent() {
                    var self = this;
                    return this.then(function (current) {
                        var parent = self.manager.getParent(current);
                        if (parent) {
                            throw new beez.Error('get parent failed. current: ' + current);
                        }
                        current = parent;
                        return current;
                    });
                },

                /**
                 * The child and its brother of the parents of View.
                 *
                 * @memberof ViewManagerAsync
                 * @instance
                 * @param {object} [options] Argument of the View object.
                 * @return {Creator}
                 */
                bro: function bro(brother, options) {
                    return this.parent().child(brother, options);
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ViewManagerAsync
                 * @override called when this chain ended
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this.manager;
                    delete this.current;
                    delete this.root;
                }
            }
        );

        /**
         * ViewManager Class
         *
         * @class
         * @name ViewManager
         */
        var ViewManager = beez.extend(
            'beez.mvcr.ViewManager',
            ManagerBase,
            {

                /**
                 * Constructor
                 *
                 * @memberof ViewManager
                 * @instance
                 */
                initialize: function initialize() {
                    ViewManager.__super__.initialize.apply(this, arguments);
                },

                /**
                 * Generating ViewManagerAsync
                 *
                 * @memberof ViewManager
                 * @instance
                 * @return {ViewManagerAsync}
                 */
                async: function async() {
                    return new ViewManagerAsync(this);
                },

                /**
                 * Set the Root View
                 *
                 * @memberof ViewManager
                 * @instance
                 * @param {View} RootView vidx is '@' must
                 * @return {View}
                 */
                root: function root(RootView) {
                    this.add('/', new function DummyRootView() { this.vidx = '@'; });
                    var rootView = new RootView(this);
                    var rootChildren = this.getChildren(this.get("/@")); // save
                    this.remove('/@');

                    var root = this.get('/@');
                    if (root) {
                        throw new beez.Error('root already exists!');
                    }

                    if (rootView.vidx !== '@') {
                        throw new beez.Error('roots vidx must be "@"');
                    }

                    this.add('/', rootView);

                    // re-save
                    for (var i = 0; i < rootChildren.length; i++) {
                        this.add('/@', rootChildren[i]);
                    }

                    return rootView;
                },


                /**
                 * Generate View.
                 *
                 * @memberof ViewManager
                 * @instance
                 * @param {String} prefix parent prefix
                 * @param {View|Array<View>} View Generate View object(s).
                 * @param {Object} [options] Argument of the View object.
                 * @return {Array}
                 */
                create: function create(prefix, View, options) {
                    if (!View || (!_.isArray(View) && typeof View !== 'function')) {
                        throw new beez.Error('View does not exist / does not be funciton. Specified prefix: ' + prefix);
                    }

                    if (!prefix) {
                        throw new beez.Error('No prefix specified. Creating:' + View.name);
                    }

                    if (prefix.indexOf('/@') < 0) {
                        throw new beez.Error('prefix must started by "/@". Creating:' + View.name);
                    }

                    if (!this.get(prefix)) { // no parent
                        throw new beez.Error('no parent exists. prefix: ' + prefix + ' ,  Please consider constructing view in Controller, or in #beforeOnce and so on.');
                    }


                    if (_.isArray(View)) {
                        return this._createArray(prefix, View, options);
                    }

                    return this._createObj(prefix, View, options);
                },

                /**
                 * Generate View(Object).
                 *
                 * @memberof ViewManager
                 * @instance
                 * @private
                 */
                _createObj: function _createObj(prefix, View, options) {
                    var v = new View(this, options);
                    if (!this.isAddable(v)) {
                        throw new beez.Error('index does not exists in the View. :' + v);
                    }
                    this.add(prefix, v);
                    return v;
                },


                /**
                 * Generate View(Array).
                 *
                 * @memberof ViewManager
                 * @instance
                 * @private
                 */
                _createArray: function _createArray(prefix, Views, options) {
                    var self = this;
                    // forced array
                    if (options && !_.isArray(options)) {
                        options = [options];
                    }

                    var instances = [];
                    _.each(Views, function (C, idx) {  // new
                        var params = options ? options[idx] : undefined;
                        var v = new C(self, params);
                        instances.push(v);
                    });

                    _.each(instances, function (view) { // check
                        if (!this.isAddable(view)) {
                            throw new beez.Error('index does not exists in the View. :' + view);
                        }
                    }, this);

                    this.add(prefix, instances);
                    return instances;
                },

                /**
                 * remove
                 *
                 * @name remove
                 * @memberof ViewManager
                 * @instance
                 * @param {String} path
                 */
                remove: function remove(path) {
                    ViewManager.__super__.remove.apply(this, arguments);
                },

                /**
                 * Dispose view and self from management.
                 *
                 * @memberof ViewManager
                 * @instance
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');

                    var managedChildren = this.getChildrenAll(this.objs);

                    _.each(managedChildren, function (key) {
                        key.dispose();
                    });

                    ViewManager.__super__.dispose.apply(this, arguments);
                }
            }
        );

        // -------------------
        // View

        /**
         * View class Asynchronous
         *
         * @class
         * @name ViewAsync
         * @extends {Bucks}
         * @private
         */
        var ViewAsync = beez.Bucks.extend(
            'beez.mvcr.ViewAsync',
            {

                /**
                 * @memberof ViewAsync
                 * @param {View} root Root View
                 */
                initialize: function initialize(root) {
                    this._root = root;
                },

                /**
                 * Processing is performed by the flow of [beforeOnce -> before -> render -> after -> afterOnce].
                 *
                 * @memberof Renderer
                 * @instance
                 * @param {BeezView} view
                 * @param {boolen} [renderChildren=true]
                 */
                _render: function _render(view) {

                    // start with view
                    this.then(function () {
                        return view;
                    });

                    if (!view.state.isBeforeOnce) { // check flag
                        // call beforeOnce
                        this.then(function beforeOnce(view, next) {
                            if (!view.visible) {
                                logger.debug('view', view.vidx, 'is not visible. skip `beforeOnce`.');
                                next(null, view); // skip
                                return;
                            }

                            // if `beforeOnce` have `done` as a param
                            if (view.beforeOnce.length > 0) {
                                view.beforeOnce(function wrappedDone() {
                                    view.state.isBeforeOnce = true;
                                    next(null, view);
                                });
                                return;
                            }

                            // else exec as sync
                            view.beforeOnce();
                            view.state.isBeforeOnce = true;
                            next(null, view);
                        });
                    }


                    // call before
                    this.then(function before(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `before`.');
                            next(null, view); // skip
                            return;
                        }

                        // if `before` have `done` as a param
                        if (view.before.length > 0) {
                            view.before(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }
                        // else exec as sync
                        view.before();
                        next(null, view);

                    });


                    // call render
                    this.then(function render(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `render`.');
                            next(null, view); // skil
                            return;
                        }

                        // if `render` have `done` as a param
                        if (view.render.length > 0) {
                            view.render(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }

                        // else exec as sync
                        view.render();
                        next(null, view);
                        return;
                    });

                    // call after
                    this.then(function after(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip `after`.');
                            next(null, view); // skip
                            return;
                        }

                        // if `afterOnce` have `done` as a param
                        if (view.after.length > 0) {
                            view.after(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }

                        // else exec as sync
                        view.after();
                        next(null, view);
                        return;
                    });

                    if (!view.state.isAfterOnce) { // check flag

                        // call afterOnce
                        this.then(function afterOnce(view, next) {
                            if (!view.visible) {
                                logger.debug('view', view.vidx, 'is not visible. skip `afterOnce`.');
                                next(null, view); // skip
                                return;
                            }

                            // if `afterOnce` have `done` as a param
                            if (view.afterOnce.length > 0) {
                                view.afterOnce(function wrappedDone() {
                                    view.state.isAfterOnce = true;
                                    next(null, view);
                                });

                                return;
                            }

                            // else exec as sync
                            view.afterOnce();
                            view.state.isAfterOnce = true;
                            next(null, view);
                            return;
                        });
                    }

                    this.then(function rendered(view, next) {
                        if (!view.visible) {
                            logger.debug('view', view.vidx, 'is not visible. skip trigger events beez:view:render');
                            next(null, view);
                            return;
                        }
                        logger.debug('view', view.vidx, 'is rendered. trigger beez:view:render');
                        view.trigger('beez:view:render');
                        next(null, view);
                        return;
                    });

                    return this;
                },


                /**
                 * Delete the View.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @param {View} view
                 * @return {View}
                 */
                _remove: function _remove(view) {

                    this.then(function () {
                        return view;
                    });

                    this.then(function conceal(view, next) {
                        // if `conceal` have `done` as a param
                        if (view.conceal.length > 0) {
                            view.conceal(function wrappedDone() {
                                next(null, view);
                            });
                            return;
                        }
                        // else exec as sync
                        view.conceal();
                        next(null, view);
                        return;
                    });

                    this.then(function remove(view, next) {
                        view.remove();
                        logger.debug('view', view.vidx, 'is removed. trigger beez:view:remove');
                        view.trigger('beez:view:remove');
                        next(null, view);
                        return;
                    });

                    return this;

                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * visible=false : Skip the rendering, including the child elements.
                 * showChildren=false : Only the specified view is rendered, child elements are not rendered.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @public
                 * @param {boolean} [options.showChildren=true] if not show children, set false
                 * @param {Function} options.filter show filtered view by the function 
                 * @return {ViewAsync}
                 * @throws {beez.Error} render root is not set
                 */
                show: function show(options) {
                    if (!this._root) {
                        throw new beez.Error('render root is not set. initialize renderer with root view parameter.');
                    }
                    options = options || {};

                    // TODO: Put out in the future 
                    if (beez.utils.isBoolean(options)) {
                        options = {
                            showChildren: options
                        };
                    }

                    if (options.showChildren === undefined) {
                        options.showChildren = true;
                    }

                    return this._show(this._root, options);
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * visible=false : Skip the rendering, including the child elements.
                 * showChildren=false : Only the specified view is rendered, child elements are not rendered.
                 *
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to show
                 * @param {boolean} [options.showChildren=true] if not show children, set false
                 * @param {Function} options.filter show filtered view by the function 
                 * @return {ViewAsync}
                 */
                _show: function _show(view, options) {
                    logger.debug('showing', view.vidx);

                    var self = this;
                    var children = view.getChildren();

                    if (options.filter) {
                        logger.debug('filtering', view.vidx);
                        children = _.filter(children, options.filter);
                    }

                    this._render(view);

                    if (children.length > 0 && options.showChildren) {
                        children.sort(function (a, b) {
                            if (a.order < b.order) {
                                return -1;
                            }
                            if (a.order > b.order) {
                                return 1;
                            }

                            return 0;
                        });

                        _.each(children, function (v) {
                            self._show(v, options);
                        });
                    }

                    return this;
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * want to hide the View. And hide also to the child element
                 * hideChildren=false: Child element is not hidden.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to hide
                 * @param {boolean} [options.hideChildren=true] if set false, children not be removed
                 * @param {Function} options.filter hide filetered view by the function 
                 * @return {ViewAsync}
                 */
                hide: function hide(options) {
                    if (!this._root) {
                        throw new beez.Error('render root is not set. initialize renderer with root view parameter.');
                    }
                    options = options || {};

                    // TODO: Put out in the future 
                    if (beez.utils.isBoolean(options)) {
                        options = {
                            hideChildren: options
                        };
                    }

                    if (options.hideChildren === undefined) {
                        options.hideChildren = true;
                    }
                    return this._hide(this._root, options);
                },


                /**
                 * Handles the rendering of the View.
                 * Child elements are rendered.
                 *
                 * want to hide the View. And hide also to the child element
                 * hideChildren=false: Child element is not hidden.
                 *
                 * @memberof ViewAsync
                 * @instance
                 * @private
                 * @param {View} view view to hide
                 * @param {boolean} [options.hideChildren=true] if set false, children not be removed
                 * @param {Function} options.filter hide filetered view by the function 
                 * @return {ViewAsync}
                 */
                _hide: function _hide(view, options) {
                    logger.debug('hiding', view.vidx);

                    var self = this;
                    var children = view.getChildren();

                    if (options.filter) {
                        logger.debug('filtering', view.vidx);
                        children = _.filter(children, options.filter);
                    }

                    if (children.length > 0 && options.hideChildren) {
                        children.sort(function (a, b) {
                            if (a.order < b.order) {
                                return 1;
                            }
                            if (a.order > b.order) {
                                return -1;
                            }

                            return 0;
                        });
                        _.each(children, function (v) {
                            self._hide(v, options);
                        });
                    }

                    // case of single view
                    logger.debug('hiding', view.vidx);
                    this._remove(view);

                    return this;
                },

                /**
                 * Disposes of the instance
                 *
                 * @memberof ViewAsync
                 * @instance
                 */
                dispose: function dispopse() {
                    logger.trace(this.constructor.name, 'dispose');
                    delete this._root;
                }

            }
        );

        /**
         * View class
         *
         * @namespace beez.mvcr
         * @class
         * @name View
         * @extends {Backbone.View}
         * @see Backbone.View
         */
        var View = beez.extend(
            'beez.mvcr.View',
            Base,
            Backbone.View.prototype,
            {

                /**
                 * Constructor
                 *
                 * @memberof View
                 */
                constructor: function constructor() {
                    if (arguments.length < 1) {
                        throw new beez.Error('In order to create a View, requires one arguments.');
                    }
                    this.manager = arguments[0];

                    /**
                     * Management flag
                     * @memberof View
                     */
                    this.state = {
                        isBeforeOnce: false,
                        isAfterOnce: false
                    };

                    /**
                     * Skip rendering flag
                     *
                     * @memberof View
                     * @instance
                     * @property visible
                     * @type {boolean}
                     */
                    this.visible = true;

                    View.__super__.constructor.apply(this, Array.prototype.slice.call(arguments, 1));
                },

                /**
                 * call initialize method
                 *
                 * @memberof View
                 * @name initialize
                 * @override Backbone.View.initialize()
                 */
                initialize: function initialize() {
                    // call Backbone.View.initialize()
                    View.__super__.initialize.apply(this, arguments);
                },
                /**
                 * Index for View management.
                 *
                 * @memberof View
                 * @instance
                 * @property vidx
                 */
                vidx: undefined, // View Index key

                /**
                 * HTMLElement
                 * @see Backbone#View
                 *
                 * @memberof View
                 * @instance
                 * @property el
                 */
                el: undefined,

                /**
                 * The order from the parent View
                 *
                 * @memberof View
                 * @instance
                 * @property order
                 */
                order: 0,

                /**
                 * The function performed before render is performed when a show function is performed. (only once)
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * beforeOnce: function beforeOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 *
                 */
                beforeOnce: beez.none,


                /**
                 * The function performed before render is performed when a show function is performed.
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * before: function before(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                before: beez.none,

                /**
                 * Execute after this view have been rendered.
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * after: function after(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                after: beez.none,


                /**
                 * Execute once after this view have been rendered.
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * afterOnce: function afterOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                afterOnce: beez.none,

                /**
                 * Generate async class
                 *
                 * @memberof View
                 * @instance
                 * @return {ViewAsync}
                 */
                async: function async() {
                    return new ViewAsync(this);
                },

                /**
                 * Return existence of HTMLElement on DOM tree in this view.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @return {boolean}
                 */
                isRendered: function isRendered() {
                    return !!this.el && !!this.el.parentElement;
                },

                /**
                 * set visible
                 *
                 * @memberof View
                 *
                 * @param {boolean} visible
                 * @throw {Error} typeof visible invalid. should be boolean
                 * @return {View} this
                 */
                setVisible: function setVisible(visible) {
                    if (typeof visible !== 'boolean') {
                        throw beez.Error('typeof visible invalid. should be boolean.');
                    }
                    this.visible = visible;
                    return this;
                },


                /**
                 * Disposes of the instance and remove HTMLElement
                 * and undelegate event on all view.
                 *
                 * @memberof View
                 * @instance
                 * @override Backbone.View.undelegateEvents
                 * @return
                 */
                dispose: function dispose() {
                    logger.trace(this.constructor.name, 'dispose');

                    this.remove();

                    // call Backbone.undelegateEvents method
                    View.__super__.undelegateEvents.apply(this, arguments);

                    delete this.manager;
                    delete this.state;
                    delete this.visible;
                    delete this.cid;
                    delete this.options;
                    delete this.$el;
                    delete this.model;
                    delete this.collection;
                    delete this.el;
                    // delete this.id;
                    delete this.attributes;
                    delete this.className;
                    delete this.tagName;
                    // delete this.events;

                    // call Base.dispose()
                    // View.__super__.dispose.call(this);
                },

                /**
                 * The function performed before remove is performed
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * conceal: function conceal(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                conceal: beez.none,

                /**
                 * Remove HTMLElement.
                 *
                 * @memberof View
                 * @function
                 * @override Backbone.View.remove
                 * @return
                 */
                remove: function remove() {
                    // call Backbone.remove
                    View.__super__.remove.apply(this, arguments);
                }
            }
        );


        /**
         * @memberof View
         * @function
         * @param {String} [name]
         * @param {Object} childProto
         * @borrows beez.extendThis as extend
         * @example
         * var MyView = View.extend(
         *     'myapp.MyView',
         *     {
         *         vidx: 'foo',
         *         bar: function bar() {}
         *     }
         * );
         */
        View.extend = beez.extendThis;

        return {
            View: View,
            ViewAsync: ViewAsync,
            ViewManager: ViewManager,
            ViewManagerAsync: ViewManagerAsync
        };
    });
})(this);

/**
 * @fileOverview Controller/ControllerManager
 * @name controller.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define('beez-mvcr/controller',['require','exports','module','beez.core','beez.mvcr','beez.i18n'],function __Controller__(require, exports, module) {
        

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
                constructor: function constructor() {

                    /**
                     * Management flag
                     * @memberof Controller
                     */
                    this.state = {
                        isBeforeOnce: false,
                        isAfterOnce: false
                    };

                    // call Backbone.contoller.constructor
                    Controller.__super__.constructor.apply(this, arguments);
                },

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
                 * The function performed before a method is performed when a navigate function is performed. (only once)
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof Controller
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * beforeOnce: function beforeOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 *
                 */
                beforeOnce: beez.none,


                /**
                 * The function performed before a method is performed when a navigate function is performed.
                 * Until next runs to waiting after that function, to define a next as an argument, to delay the process.
                 *
                 * @memberof Controller
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * before: function before(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 *
                 */
                before: beez.none,

                /**
                 * Execute after this controller method performed.
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * after: function after(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                after: beez.none,

                /**
                 * Execute once after this controller method performed.(only once)
                 * You can delay processes to give `next` in arugument, then processes made to be delayed untill for call `next`.
                 *
                 * @memberof View
                 * @instance
                 * @function
                 * @param {Function} [next]
                 * @example
                 * afterOnce: function afterOnce(next) {
                 *     somethingAsync(function() {
                 *         next();
                 *     });
                 * }
                 */
                afterOnce: beez.none,

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
                 * Processing is performed by the flow of [beforeOnce -> before -> render -> after -> afterOnce].
                 *
                 * @memberof Controller
                 * @instance
                 * @private
                 * @param {String} name method name of controller
                 * @param {Array} parameter the paramter which will be passed to the method
                 * @param {Function} callback
                 */
                show: function show(name, parameter, callback) {
                    var self = this;
                    var job = new beez.Bucks();
                    var isAsync = beez.utils.isFunction(callback);
                    var _normalize = function (name, parameter, done) {
                        var method = self[name],
                            length = method.length,
                            args = _.clone(parameter);

                        if (length && isAsync) {
                            args[length - 1] = done;
                            method.apply(self, args);
                        } else {
                            method.apply(self, args);
                            done();
                        }
                    };

                    // call before once
                    if (!this.state.isBeforeOnce) {
                        job.then(function beforeOnce(res, next) {
                            _normalize('beforeOnce', parameter, function () {
                                self.state.isBeforeOnce = true;
                                next(null, self);
                            });
                        });
                    }
                    // call before
                    job.then(function before(res, next) {
                        _normalize('before', parameter, function () {
                            next(null, self);
                        });
                    });
                    // call method
                    job.then(function exec(res, next) {
                        _normalize(name, parameter, function () {
                            next(null, self);
                        });
                    });
                    // call after
                    job.then(function after(res, next) {
                        _normalize('after', parameter, function () {
                            next(null, self);
                        });
                    });
                    // call afterOnce
                    if (!this.state.isAfterOnce) {
                        job.then(function afterOnce(res, next) {
                            _normalize('afterOnce', parameter, function () {
                                self.state.isAfterOnce = true;
                                next(null, self);
                            });
                        });
                    }

                    // fire!!
                    job.end(function (err, ress) {
                        if (callback) {
                            callback(err, ress);
                        } else if (err) {
                            throw err;
                        }
                    });
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

/**
 * @fileOverview Router
 * @name router.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagnet.co.jp>
 */

(function (global) {
    define('beez-mvcr/router',['require','exports','module','beez.core','beez.mvcr','backbone'],function (require, exports, module) {
        

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
                                    controller.show(data.name, parameter, function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        next(null, res);
                                    });
                                } else {
                                    logger.trace("run controller exec function(sync). data:", data);
                                    controller.show(data.name, parameter);
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

/**
 * @fileOverview CSSManager
 * @name cssmanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {

    define('beez-mvcr/cssmanager',['require','exports','module','beez.core'],function (require, exports, module) {
        

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

/**
 * @fileOverview CSSManager
 * @name imagemanager.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * @overview image management functions
 */

(function (global) {

    define('beez-mvcr/imagemanager',['require','exports','module','beez.core','beez.utils'],function (require, exports, module) {
        

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
    define('beez.mvcr',['require','exports','module','beez.core','handlebars','beez-mvcr/model','beez-mvcr/modic','beez-mvcr/view','beez-mvcr/controller','beez-mvcr/router','beez-mvcr/cssmanager','beez-mvcr/imagemanager','beez-mvcr/base','backbone','beez-mvcr/model','beez-mvcr/view','beez-mvcr/controller','beez-mvcr/router','beez-mvcr/cssmanager','beez-mvcr/imagemanager'],function __MVCR__(require, exports, module) {
        

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
