/**
 * @name result.js<search/view>
 * @author <author>
 * @overview view of result
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('search.view.result');

    var template = require('search/hbs/result.hbsc');

    /**
     * View class
     *
     * @namespace search
     * @class
     * @name ResultView
     * @extends {beez.View}
     * @see beez.View
     */
    var ResultView = beez.View.extend(
        'search.view.ResultView',
        {
            /**
             * $el.name
             *
             * @memberof ResultView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'div',

            /**
             * $el.class
             *
             * @memberof ResultView
             * @name className
             * @type {String}
             * @override Backbone.View.className
             * @readonly
             */
            className: "result",

            /**
             * $el.id
             *
             * @memberof ResultView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: 'result',

            /**
             * Result path view manager
             *
             * @memberof ResultView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: 'result',

            /**
             * Display order
             *
             * @memberof ResultView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 0,

            /**
             * constructor
             *
             * @constructor
             * @memberof ResultView
             * @function
             */
            initialize: function initialize() {
                this.listenTo(this.collection, 'sync', this.onRerender);
            },

            /**
             * view re-load
             *
             * @memberof ResultView
             * @function
             * @param {search.model.SearchCollection} collection
             * @param {Object} resp
             * @param {Object} options
             */
            onRerender: function (collection, resp, options) {
                this.async().show().end();
            },

            /**
             * DOM rendering
             *
             * @memberof ResultView
             * @function
             */
            render: function render() {
                var self = this;
                var t = template({
                    result: this.collection.toJSON(),
                    total: this.collection.total
                });

                this.getParent().$el.append(this.$el.html(t));
            }
        });

    return ResultView;
});
