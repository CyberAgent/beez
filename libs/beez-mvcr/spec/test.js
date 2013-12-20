define(['controller', 'beez.core'], function(c, beez){
    var Controller = c.Controller;
    var TestController = Controller.extend(
        'test.controller.TestController',
        {
            initialize: function initialize() {
            },
            css: [
                'https://raw.github.com/fkei/mjson-server/master/public/stylesheets/style.css',
                '/m/public/styl/style.css', // beez-foundation started!! ok
                'https://raw.github.com/fkei/mjson-server/master/public/stylesheets/style.css',
                'm/public/styl/style.css' // beez-foundation started!! ok
            ],

            i18n : {
                en: 'spec/i18n/en',
                ja: 'spec/i18n/ja'
            },

            //test: function(name, next) {
            test: function(name, desc, next) {
                console.log("spec/test.js#test exec!!");
                var self = this;
                setTimeout(function () {
                    self.message();
                    next && next();
                }, 100);
            },
            message: function() {
                var message = beez.i18n.__('name');
                console.log(message);
                return message;
            }
        });

    return TestController;
});
