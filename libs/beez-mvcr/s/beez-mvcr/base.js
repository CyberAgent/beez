/**
 * @name base.js<beez-mvcr>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp">
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define(function (require, exports, module) {
        'use strict';

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
