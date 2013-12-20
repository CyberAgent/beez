/**
 * @name suns.js
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview Object extending utilities for node and browser (amd support)
 */

(function (global) {
    'use strict';

    // no-op function
    var none = function none() {};


    var arrayForEach = Array.prototype.forEach;
    var breaker = {};

    /**
     * call iterator for each property of obj
     * @function
     * @private
     * @param {Object} obj
     * @param {Function} iterator
     * @param {Object} context
     */
    var each = function each(obj, iterator, context) {

        if (obj === undefined || obj === null) { return; }
        if (arrayForEach && obj.forEach === arrayForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    };

    /**
     * copy object's properties
     * @function
     * @private
     * @param {Object} obj
     */
    var copyProps = function CopyProps(obj) {
        each(Array.prototype.slice.call(arguments, 1), function (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };

    var superProp_reg = /__(super)+__/;

    /**
     * extend from parent with a childProto object.
     * @param {String} [name]
     * @param {Function} parent
     * @param {Object} childProto
     */
    var _extendOne = function _extendOne(name, parent, childProto) {

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.

        var child;

        if (typeof childProto !== 'object') {
            throw new Error('typeof childCtorOrProto invalid. it should be Object (prototype object).');
        }

        if (childProto && Object.prototype.hasOwnProperty.call(childProto, 'constructor')) {
            child = childProto.constructor;
        } else {
            child = new Function('parent', 'return function ' + name + '(){ parent.apply(this, arguments); };')(parent);
        }

        // Add static properties
        copyProps(child, parent);

        var Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        if (childProto) {
            copyProps(child.prototype, childProto);
        }

        for (var prop in parent) {
            if (superProp_reg.test(prop)) {
                var superProp = prop.replace('super', 'supersuper');
                child[superProp] = parent[prop];
            }
        }
        child.__super__ = parent.prototype;
        child.__superCtor__ = parent;

        return child;
    };

    /**
     * extend multiple children
     * @param {String} name
     * @param {Function} parent
     * @param {Array<Object>} children
     */
    var _extend = function _extend(name, parent, children) {

        if (children.length < 1) {
            // end of recursion
            return parent;
        }

        // get first childProto
        var childProto = children.shift();
        var child = _extendOne(name, parent, childProto);

        // extend recursively
        return _extend(name, child, children);
    };

    /**
     * define prototype chain properly and
     * create new object that extends parent object.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Function} parent function as a parent
     * @param {Object} childProto prototype object as a child
     * @param {Object} [childProto] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var Parent = function Parent() {};
     * var Child = extend(
     *     'Child',
     *     Parent,
     *     {
     *         initialize: function initialize()
     *     }
     * );
     */
    var extend = function extend(/** name, */ parent, childProto /** childProto... */) {

        var name = '';
        var args = Array.prototype.slice.apply(arguments);
        if (typeof args[0] === 'string') {
            name = args.shift();
            //'.'が含まれているとメソッド名としてダメなので
            //'_'に置換
            name = name.replace(/\./g, '_');
        }
        parent = args.shift();

        return _extend(name, parent, args);
    };

    /**
     * `Object.extend = suns.extendThis`
     * makes Object extendable.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Object} childProto prototype object as a child
     * @param {Object} [childProto] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var FooClass = function FooClass() {
     * };
     * FooClass.prototype = {
     *     func1: function func1() {}
     * };
     * FooClass.extend = suns.extendThis;
     *
     * // OK
     * var Child = FooClass.extend({
     *     childFunc: function childFunc() {}
     * });
     * // same as
     * Child = suns.extend(FooClass, {
     *     childFunc: function childFunc() {}
     * });
     */
    var extendThis = function extendThis(/** name, */ childProto /**, childProto */) {
        var parent = this;

        var args = Array.prototype.slice.apply(arguments);
        var newArgs = [];
        if (typeof args[0] === 'string') {
            newArgs.push(args.shift()); // name
        }
        newArgs.push(parent);
        newArgs = newArgs.concat(args);
        return extend.apply(this, newArgs);
    };

    /**
     * mixin from parent with a child's prototype object or constructor
     * @param {String} [name]
     * @param {Function} parent
     * @param {Object} childProto
     */
    var _mixOne = function _mixOne(name, parent, childCtorOrProto) {

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.

        var child, childProto;

        var typeOfChild = typeof childCtorOrProto;
        if (typeOfChild === 'function') {
            childProto = childCtorOrProto.prototype;
        } else if (typeOfChild === 'object') {
            childProto = childCtorOrProto;
        } else {
            throw new Error('typeof childCtorOrProto invalid. it should be Function or Object.');
        }

        if (typeOfChild === 'function') {
            // if child is constructor function,
            // wrap child constructor to call
            // both parent's constructor and child constructor.
            child = new Function('parent, childCtor', 'return function ' + name + '(){ parent.apply(this, arguments); childCtor.apply(this, arguments)};')(parent, childCtorOrProto);
        } else if (childProto && Object.prototype.hasOwnProperty.call(childProto, 'constructor')) {
            child = childProto.constructor;
        } else {
            child = new Function('parent', 'return function ' + name + '(){ parent.apply(this, arguments); };')(parent);
        }

        // Add static properties
        copyProps(child, parent);

        var Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        if (childProto) {
            copyProps(child.prototype, childProto);
        }

        for (var prop in parent) {
            if (superProp_reg.test(prop)) {
                var superProp = prop.replace('super', 'supersuper');
                child[superProp] = parent[prop];
            }
        }
        child.__super__ = parent.prototype;
        child.__superCtor__ = parent;

        return child;
    };


    /**
     * mix multiple children.
     * @param {String} name
     * @param {Function} parent
     * @param {Array<Object>} children
     */
    var _mixin = function _mixin(name, parent, children) {

        if (children.length < 1) {
            // end of recursion
            return parent;
        }

        // get first childProto
        var childProto = children.shift();
        var child = _mixOne(name, parent, childProto);

        // extend recursively
        return _mixin(name, child, children);
    };


    /**
     * define prototype chain properly and
     * create new object that extends parent object.
     * if constructor function specified as a child,
     * parent's constructor is called automatically
     * before child's constructor called.
     * @function
     * @memberof suns
     * @param {String} [name=''] (optional) class name for easy-debug.
     * @param {Function} parent function as a parent
     * @param {Object|Function} child prototype object or constructor as a child
     * @param {Object|Function} [child] (optional) multiple children can be specified.
     * @return {Object}
     * @example
     * var Parent = function Parent() {};
     * var Child = extend(
     *     'Child',
     *     Parent,
     *     {
     *         constructor: function Child() {
     *             Child.__super__.constructor.apply(this, arguments);
     *         }
     *     }
     * );
     */
    var mixin = function mixin(/** name, */ parent, child /** child... */) {

        var name = '';
        var args = Array.prototype.slice.apply(arguments);
        if (typeof args[0] === 'string') {
            name = args.shift();
            //'.'が含まれているとメソッド名としてダメなので
            //'_'に置換
            name = name.replace(/\./g, '_');
        }
        parent = args.shift();

        return _mixin(name, parent, args);
    };

    /**
     * suns object
     * @namespace suns
     */
    var suns = {
        /**
         * @borrows extend as extend
         */
        extend: extend,

        /**
         * @borrows extendThis as extendThis
         */
        extendThis: extendThis,

        /**
         * @borrows mixin as mixin
         */
        mixin: mixin,

        /**
         * version
         * @static
         */
        VERSION: '0.4.6'
    };

    if (typeof define === 'function' && define.amd) {
        // requirejs
        define(function (require, exports, module) {
            return suns;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = suns;
    } else {
        // others, export global
        global.suns = suns;
    }

})(this);
