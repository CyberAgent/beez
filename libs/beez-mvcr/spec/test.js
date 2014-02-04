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

            beforeOnce: function beforeOnce(name, next) {
                console.log('beforeOnce parameter: ', name);
                setTimeout(function () {
                    next && next();
                }, 100);
            },

            before: function before(name, next) {
                console.log('before parameter: ', name);
                setTimeout(function () {
                    next && next();
                }, 100);
            },

            //test: function(name, next) {
            test: function test(name, desc, next) {
                console.log('test parameter: ', name);
                console.log("spec/test.js#test exec!!");
                var self = this;
                setTimeout(function () {
                    self.message();
                    next && next();
                }, 100);
            },

            testAsync: function testAsync(name, desc, next) {
                console.log("spec/test.js#testAsync exec!!");
                var self = this;
                setTimeout(function () {
                    self.message();
                    next && next();
                }, 100);
            },

            after: function after(name, desc, next) {
                console.log('after parameter: ', name, desc);
                setTimeout(function () {
                    next && next();
                }, 100);
            },

            afterOnce: function afterOnce(name, desc, next) {
                console.log('afterOnce parameter: ', name, desc);
                setTimeout(function () {
                    next && next();
                }, 100);
            },

            message: function message() {
                var message = beez.i18n.__('name');
                console.log(message);
                return message;
            }
        });

    return TestController;
});
