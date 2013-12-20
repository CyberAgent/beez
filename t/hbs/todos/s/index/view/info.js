/**
 * @name info.js<info/view>
 * @author <author>
 * @overview view of info
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var Handlebars = beez.vendor.Handlebars;
    var $ = beez.vendor.$;

    var mcss = beez.manager.css;

    // Escape OFF
    Handlebars.registerHelper('__unsafe', function __unsafe(key) {
        var message = Handlebars.helpers.__.apply(this, arguments);
        return new Handlebars.SafeString(message);
    });

    var template = require('index/hbs/info.hbsc');

    var InfoView = beez.View.extend(
        'index.view.InfoView',
        {
            tagName: 'div',
            id: 'info',
            vidx: 'info',
            order: 1,

            render: function render() {
                var self = this;
                mcss.async()
                    .load('/index/styl/info.css')
                    .then(function onload(res, next) {
                        $('body').append(self.$el.html(template()));
                        next();
                    })
                    .end()
                ;
            }

            //

        });

    return InfoView;
});
