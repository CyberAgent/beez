/**
 * @name index.js<search>
 * @author <author>
 * @overview controller of search module
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require("beez");
    var logger = beez.getLogger('search.index');

    var mv = beez.manager.view;
    var mm = beez.manager.model;

    /**
     * Search Controller class
     *
     * @namespace search
     * @class
     * @name SearchController
     * @extends {beez.Controller}
     * @see beez.Controller
     */
    var SearchController = beez.Controller.extend(
        'search.SearchController',
        {
            css: [
                '/search/styl/index.css'
            ],

            /**
             * Define i18n
             *
             * @memberof SearchController
             * @name i18n
             * @override beez.Controller.i18n
             * @protected
             */
            i18n: function i18n() {
                return {
                    en: require('search/i18n/en'),
                    ja: require('search/i18n/ja')
                };
            },

            /**
             * call initialize method
             *
             * @memberof SearchController
             * @name initialize
             * @override beez.Controller.initialize
             */
            initialize: function initialize() {
                var SearchCollection = require('search/model/search').SearchCollection;
                var searchCollection = mm.create('/@', SearchCollection);

                var SearchView = require('search/view/search');
                mv.create('/@/content', SearchView, {
                    collection : searchCollection
                });

                var ResultView = require('search/view/result');
                mv.create('/@/content/search', ResultView, {
                    collection : searchCollection
                });

            },

            searchIndex: function searchIndex(tab) {
                mv.get('/@/content/search').async().show().end();
            }

            //

        })
    ;

    return SearchController;
});
