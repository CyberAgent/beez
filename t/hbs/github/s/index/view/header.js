/**
 * @name header.js<index/view>
 * @author <author>
 * @overview view of header
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('index.view.header');

    var template = require('index/hbs/header.hbsc');

    /**
     * View class
     *
     * @namespace index
     * @class
     * @name HeaderView
     * @extends {beez.View}
     * @see beez.View
     */
    var HeaderView = beez.View.extend(
        'index.view.HeaderView',
        {
            /**
             * $el.name
             *
             * @memberof HeaderView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'header',

            /**
             * $el.id
             *
             * @memberof HeaderView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: 'header',

            /**
             * Header path view manager
             *
             * @memberof HeaderView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: 'header',

            /**
             * Display order
             *
             * @memberof HeaderView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 0,

            /**
             * DOM rendering
             *
             * @memberof HeaderView
             * @function
             */
            render: function render() {
                var t = template();
                this.getParent().$el.append(this.$el.html(t));
            }
        });

    return HeaderView;
});
