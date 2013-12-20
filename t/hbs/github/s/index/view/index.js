/**
 * @name index.js<index/view>
 * @author <author>
 * @overview view of index
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('index.view.index');

    /**
     * View class
     *
     * @namespace index
     * @class
     * @name IndexView
     * @extends {beez.View}
     * @see beez.View
     */
    var IndexView = beez.View.extend(
        'index.view.IndexView',
        {
            /**
             * $el.name
             *
             * @memberof IndexView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'section',

            /**
             * $el.id
             *
             * @memberof IndexView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: '{{name}}',

            /**
             * Index path view manager
             *
             * @memberof IndexView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: '@',

            /**
             * DOM rendering
             *
             * @memberof IndexView
             * @function
             */
            render: function render() {
                $('body').append(this.$el);
            }
        });

    return IndexView;
});
