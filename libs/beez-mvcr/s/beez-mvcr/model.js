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
    define(function (require, exports, module) {
        'use strict';

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
                 * _decideBindedModel
                 *
                 * @memberof ModelManager
                 * @instance
                 * @private
                 * @param {Object} obj
                 * @param {Boolean} isCollection
                 * @return object
                 */
                _decideBindedModel: function _decideBindedModel(obj, isCollection) {
                    var model;
                    var returnedModel;
                    var children;

                    if (!isCollection) {
                        model = obj;
                        children = [];

                        _.each(model, function (v) {
                            var c = this.getChildrenAll(v);
                            children = children.concat(c);
                        }, this);

                        var candidates = children.concat(model);

                        // remove still binded models
                        var deletes = _.reject(candidates, function (d) {
                            return d.isBinded();
                        });

                        // models in diff still have some bindings
                        var diff = _.difference(candidates, deletes);
                        _.each(diff, function (model) {
                            throw new beez.Error('a disposing model have some bindings. models cid: ' + model.cid);
                        });

                        returnedModel = deletes;
                    } else {
                        returnedModel = obj;
                    }

                    return returnedModel;
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
                        this._decideBindedModel(objs, true).removeAll &&
                        this._decideBindedModel(objs, true).removeAll(options);

                        this.deleteFromParent(objs);

                        return this;
                    }

                    if (objs && !_.isArray(objs)) {
                        objs = [objs];
                    }
                    // remove refference
                    _.each(this._decideBindedModel(objs), function (d) {
                        this.deleteFromParent(d);
                    }, this);

                    // dispose
                    _.each(this._decideBindedModel(objs), function (d) {
                        d.dispose && d.dispose();
                    });

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
                            i, l, name, names, list, events;
                        names = _.keys(this._events);
                        for (i = 0, l = names.length; i < l; i++) {
                            name = names[i];
                            list = this._events[name];
                            list = _.reject(list, function(binding) {
                                return binding.context === self;
                            });
                            if (list.length > 0) {
                                return true;
                            }
                        }
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
                            i, l, name, names, list, events;
                        names = _.keys(this._events);
                        for (i = 0, l = names.length; i < l; i++) {
                            name = names[i];
                            list = this._events[name];
                            list = _.reject(list, function(binding) {
                                return binding.context === self;
                            });
                            if (list.length > 0) {
                                return true;
                            }
                        }
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
