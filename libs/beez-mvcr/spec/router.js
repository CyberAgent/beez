/**
 * @name router.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/controller
 */

define(['router', 'beez.mvcr', 'beez.core'], function(r, mvcr, beez){
    beez.i18n.setup();
    mvcr.manager.setup();

    //var router = new r.Router();
    var RouterManager = r.RouterManager;
    //var manager = r.manager;
    var manager = new RouterManager();

    var hashNext = function () {};

    var Router = beez.Router.extend(
        'test.router',
        {
            initialize: function initialize() {
                Router.__super__.initialize.apply(this, arguments);
            },
            firstBefore: function (data, next) {
                expect(data.name).be.ok;
                next && next();
            },
            before: function (data, Controller, next) {
                expect(data.name).be.ok;
                expect(Controller).be.ok;
                next && next();
            },
            after: function (data, Controller, next) {
                expect(data.name).be.ok;
                expect(Controller).be.ok;
                hashNext();
                next && next();
            }
        }
    );

    var fragment1 = 'test/fkei';
    var fragment2 = 'testAsync/fkei/hiraki'
    var r = new Router();

    return function () {
        describe('manager', function(){
            it('constructor', function () {
                expect(r.constructor.name).eq('test_router');
            });
            it('setup', function() {
                manager.setup(null, r);
                expect(manager.setuped).be.ok;
            });
            it('navigate: async', function(next) {
                Backbone.history.start();
                manager.navigate(fragment2, true);
                expect(window.location.hash).eq('#'+ fragment2);
                hashNext = next;
            });
            it('navigate: sync', function(next) {
                manager.navigate(fragment1, true);
                expect(window.location.hash).eq('#'+ fragment1);
                hashNext = next; // 遷移先のControllerで実行
            });
            it('dispose', function() {
                expect(manager.router).be.ok;
                expect(manager.setuped).be.ok;

                manager.dispose();

                expect(manager.router).not.be.ok;
                expect(manager.setuped).not.be.ok;
            });
        });
    };
});
