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
                expect(data.name).eq('test');
                next && next();
            },
            before: function (data, Controller, next) {
                expect(data.name).eq('test');
                expect(Controller).be.ok;
                next && next();
            },
            after: function (data, Controller, next) {
                expect(data.name).eq('test');
                expect(Controller).be.ok;
                hashNext();
                next && next();
            }
        }
    );

    var fragment = "test/fkei";
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
            it('navigate', function(next) {
                Backbone.history.start();
                manager.navigate(fragment, true);
                expect(window.location.hash).eq('#'+ fragment);
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
