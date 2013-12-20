/**
 * @name content.js<index/view>
 * @author <author>
 * @overview view of content
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('index.view.content');

    //var template = require('index/hbs/content.hbsc');

    /**
     * View class
     *
     * @namespace index
     * @class
     * @name ContentView
     * @extends {beez.View}
     * @see beez.View
     */
    var ContentView = beez.View.extend(
        'index.view.ContentView',
        {
            /**
             * $el.name
             *
             * @memberof ContentView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'section',

            /**
             * $el.class
             *
             * @memberof ContentView
             * @name className
             * @type {String}
             * @override Backbone.View.className
             * @readonly
             */
            className: 'content',

            /**
             * $el.id
             *
             * @memberof ContentView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: 'content',

            /**
             * Content path view manager
             *
             * @memberof ContentView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: 'content',

            /**
             * Display order
             *
             * @memberof ContentView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 1,

            /**
             * DOM rendering
             *
             * @memberof ContentView
             * @function
             */
            render: function render() {
                //var t = template();
                this.getParent().$el.append(this.$el);
            }
        });

    return ContentView;
});
