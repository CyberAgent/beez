/**
 * @name search.js<search/view>
 * @author <author>
 * @overview view of search
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;
    var mcss = beez.manager.css;
    var logger = beez.getLogger('search.view.search');

    var template = require('search/hbs/search.hbsc');

    /**
     * View class
     *
     * @namespace index
     * @class
     * @name SearchView
     * @extends {beez.View}
     * @see beez.View
     */
    var SearchView = beez.View.extend(
        'index.view.SearchView',
        {
            /**
             * $el.name
             *
             * @memberof SearchView
             * @name tagName
             * @type {String}
             * @override Backbone.View.tagName
             * @readonly
             */
            tagName: 'div',

            /**
             * $el.id
             *
             * @memberof SearchView
             * @name id
             * @type {String}
             * @override Backbone.View.id
             * @readonly
             */
            id: 'search',

            /**
             * $el.class
             *
             * @memberof ResultView
             * @name className
             * @type {String}
             * @override Backbone.View.className
             * @readonly
             */
            className: "search",

            /**
             * Search path view manager
             *
             * @memberof SearchView
             * @name vidx
             * @type {String}
             * @override beez.View
             * @readonly
             */
            vidx: 'search',

            /**
             * Display order
             *
             * @memberof SearchView
             * @name order
             * @type {Integer}
             * @override beez.View
             */
            order: 0,

            /**
             * Events
             *
             * @memberof SearchView
             * @name events
             * @type {Object}
             * @override Backbone.View.className
             */
            events: {
                'click button': 'onSearch'
            },

            //////

            /**
             * search event.
             *
             * @memberof SearchView
             * @function
             */
            onSearch: function onSearch() {
                var self = this;

                var query = this.$el.find("#word").val();

                this.$el.find('#result').html('<div class="alert alert-info">Loading ...</div>');

                this.collection.fetch({
                    data: { q: query },
                    success: function (collection) {
                        self.$el.find('#result').html('');
                    },
                    error: function (collection, xhr, response) {
                        var messages = [
                            xhr.status,
                            xhr.statusText,
                            xhr.responseJSON.message,
                            xhr.responseJSON.documentation_url
                        ];

                        self.$el.find('#result').html('<div class="alert alert-danger"><p>' + messages.join(' ') + '</p></div>');
                    }
                });
            },

            //////

            /**
             * DOM rendering
             *
             * @memberof SearchView
             * @function
             */
            render: function render() {
                var t = template();
                this.getParent().$el.append(this.$el.html(t));
            }
        });

    return SearchView;
});
