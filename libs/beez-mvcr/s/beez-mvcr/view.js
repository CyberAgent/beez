/**
 * @fileOverview View
 * @name view.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

(function (global) {
    define(function __View__(require, exports, module) {
        'use strict';

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
                        // else exec as sync
                        view.remove();
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
