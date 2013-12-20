/**
 * @name search.js<search/model>
 * @author <author>
 * @overview model of search
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var logger = beez.getLogger('model.search');

    var mv = beez.manager.v;
    var mm = beez.manager.m;

    var SearchModel = beez.Model.extend(
        'search.model.SearchModel',
        {
            midx: 'search',
            defaults: {}

            //

        }
    );
    var SearchCollection = beez.Collection.extend(
        'search.modelSearchCollection',
        {
            midx  : 'search',
            model : SearchModel,
            url  : function url() {
                return this.urlRoot + '/search/repositories';
            },
            parse : function parse(resp, options) {
                this.total = resp.total_count;
                return resp.items;
            }
            //
        }
    );

    return {
        SearchModel: SearchModel,
        SearchCollection: SearchCollection
    };

});
