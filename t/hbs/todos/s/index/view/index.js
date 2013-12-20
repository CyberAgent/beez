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

    var IndexView = beez.View.extend(
        'index.view.IndexView',
        {
            tagName: 'section',
            id: 'todoapp',
            vidx: '@',
            order: 0,

            render: function render(done) {
                var self = this;
                mcss.async()
                    .load('/index/styl/index.css')
                    .then(function onload() {
                        $('body').html(self.$el);
                        done();
                    })
                    .end()
                ;
            }

            //

        });

    return IndexView;
});
