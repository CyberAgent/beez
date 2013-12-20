/**
 * @name controller.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/controller
 */

define(['controller', 'beez.mvcr', 'beez.core'], function (c, mvcr, beez){
    mvcr.manager.setup();

    var Controller = c.Controller;
    var ControllerManager = c.ControllerManager;
    //var manager = c.manager;
    var manager = new ControllerManager();
    var TestController = Controller.extend(
        'test.controller.TestController',
        {
            dummy: function () {
                return "dummy";
            }
        });

    var TestController1 = Controller.extend(
        'test.controller.TestController1',
        {
            css: [
                'https://raw.github.com/fkei/mjson-server/master/public/stylesheets/style.css',
                '/m/public/styl/style.css' // beez-foundation started!! ok
            ],

            i18n : {
                en: 'spec/i18n/en',
                ja: 'spec/i18n/ja'
            },

            dummy: function () {
                return "dummy1";
            },
            message: function () {
                return beez.i18n.__('name');
            }
        }
    );
    var TestController2 = Controller.extend(
        'test.controller.TestController2',
        {
            css: [
                'https://raw.github.com/fkei/mjson-server/master/public/stylesheets/style.css',
                '/m/public/styl/style.css' // beez-foundation started!! ok
            ],

            i18n : function i18n(next) {
                require(['spec/i18n/en', 'spec/i18n/ja'], function (en, ja) {
                    next(null, {
                        en: en,
                        ja: ja
                    });
                });
            },
            dummy: function () {
                return "dummy2";
            },
            message: function () {
                return beez.i18n.__('name');
            }
        }
    );

    var testController1;
    var testController2;

    return function () {
        describe('Controller', function (){
            it('new', function () {
                testController1 = new TestController1();
                testController2 = new TestController2();
            });
            it('css', function (done) {
                testController1.loadCSS(function (err, ress) {
                    var styles = $('link[rel=stylesheet]');
                    expect(!!styles[1].href.match(testController1.css[0])).to.be.ok;
                    expect(!!styles[2].href.match(testController1.css[1])).to.be.ok;

                    expect(testController1.constructor.name).equals("test_controller_TestController1");
                    expect(testController1.dummy()).equals("dummy1");

                    testController2.loadCSS(function (err, ress) {
                        var styles = $('link[rel=stylesheet]');
                        expect(!!styles[1].href.match(testController2.css[0])).to.be.ok;
                        expect(!!styles[2].href.match(testController2.css[1])).to.be.ok;

                        expect(testController2.constructor.name).equals("test_controller_TestController2");
                        expect(testController2.dummy()).equals("dummy2");

                        done();
                    });
                });


            });
            it('i18n', function (done) {
                beez.i18n.setup();
                testController1.loadI18n(function (err) {
                    expect(beez.i18n.__('name')).eq('えふけい').be.ok;
                    expect(testController1.message()).equals("えふけい");

                    testController2.loadI18n(function (err) {
                        expect(beez.i18n.__('name')).eq('えふけい').be.ok;
                        expect(testController2.message()).equals("えふけい");
                        done();
                    });
                });
            });
        });

        describe('ControllerManager', function () {
            var controllerManager = new ControllerManager();
            it('Do you can generate ControllerManager.', function () {
                expect((typeof controllerManager.controllers)).equals("object");
            });
        });

        describe('ControllerManager#Instance', function () {
            it('create() [async]', function (done) {
                manager
                    .async()
                    .create('async', TestController)
                    .then(function onSuccess() {
                        var controller = manager.get('async');
                        expect(controller.dummy()).equals('dummy');
                               expect(manager.controllers).have.property('async').be.ok;
                        done();
                    })
                    .error(function onError(err, next) {
                        expect(err.message || err.name).be.ok;
                        done();
                    })
                    .end()
                ;
            });
            it('get()/remove() [sync]', function () {
                expect(manager.get('async')).be.ok;
                manager.remove('async');
                var async = manager.get('async');
                if (async) {
                    expect("remove error. name: async").be.ok;
                } else {
                    expect(true).be.ok
                }
            });
            it('dispose', function () {
                expect(testController1.css).be.ok;
                testController1.dispose();
                expect(testController1.css).not.be.ok;
                manager.dispose();
                expect(!!manager.controllers).not.be.ok
            });
        });
    };
});
