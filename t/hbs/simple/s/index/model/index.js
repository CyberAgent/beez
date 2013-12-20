/**
 * @name index.js<index/model>
 * @author <author>
 * @overview model of index
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var logger = beez.getLogger('model.index');

    var mv = beez.manager.v;
    var mm = beez.manager.m;

    /**
     * Index Model class (Root)
     *
     * @namespace index
     * @class
     * @name IndexModel
     * @extends {beez.Model}
     * @see beez.Model
     */
    var IndexModel = beez.Model.extend(
        'index.model.IndexModel',
        {
            /**
             * Index path model manager
             *
             * @memberof RootModel
             * @name midx
             * @type {String}
             * @readonly
             */
            midx: '@'

            //

        }
    );

    return IndexModel;
});
