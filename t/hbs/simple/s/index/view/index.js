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
    var logger = beez.getLogger('index.view');

    var template = require('index/hbs/index.hbsc');

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
             * Display order
             *
             * @memberof IndexView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 0,

            /**
             * DOM rendering
             *
             * @memberof IndexView
             * @function
             * @param {function} done Asynchronous completion function
             */
            render: function render(done) {
                var self = this;
                mcss.async().load('/index/styl/index.css').then(function onload() {
                    $('body').append(self.$el.html(template({project: "{{name}}"})));
                    done();
                }).end();
            }
        });

    return IndexView;
});
