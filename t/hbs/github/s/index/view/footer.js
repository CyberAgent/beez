/**
 * @name footer.js<index/view>
 * @author <author>
 * @overview view of footer
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('index.view.footer');

    var template = require('index/hbs/footer.hbsc');

    /**
     * View class
     *
     * @namespace index
     * @class
     * @name FooterView
     * @extends {beez.View}
     * @see beez.View
     */
    var FooterView = beez.View.extend(
        'index.view.FooterView',
        {
            /**
             * $el.name
             *
             * @memberof FooterView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'footer',

            /**
             * $el.class
             *
             * @memberof ContentView
             * @name footer
             * @type {String}
             * @override Backbone.View.className
             * @readonly
             */
            className: 'footer',

            /**
             * $el.id
             *
             * @memberof FooterView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: 'footer',

            /**
             * Footer path view manager
             *
             * @memberof FooterView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: 'footer',

            /**
             * Display order
             *
             * @memberof FooterView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 2,

            /**
             * DOM rendering
             *
             * @memberof FooterView
             * @function
             */
            render: function render() {
                var t = template();
                this.getParent().$el.append(this.$el.html(t));
            }
        });

    return FooterView;
});
