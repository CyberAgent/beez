/**
 * @name index.js<spec/index>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/index
 */

define(['beez.core'], function(index){

    return function() {
        describe('index', function(){
            it('Member variable', function() {
                expect(index.Bucks.name).eq("Bucks");
                expect(index.Error.name).eq("BeezError");
                expect(index.global.constructor.name).eq("Window");
                expect(index.root.constructor.name).eq("Window");
                expect(index.defines.globals.DEBUG).be.ok;
            });

            it('extend/extendThis', function() {
                var __FooClass__ = {
                    initialize: function initialize() {},
                    func1: function func1() { return true; }
                };
                var FooClass = index.extend(function constructor() {
                    this.initialize();
                }, __FooClass__);
                FooClass.extend = index.extendThis;

                // OK
                var Child = FooClass.extend({
                    dummy: true
                });

                expect((new Child()).func1()).be.ok;

            });

            it('extend/extendThis', function() {
                var __FooClass__ = {
                    initialize: function initialize() {},
                    func1: function func1() { return true; }
                };
                var FooClass = index.mixin(function constructor() {
                    this.initialize();
                }, __FooClass__);

                expect((new FooClass()).func1()).be.ok;
            });

            it('logging', function() {
                var logger = index.getLogger("test");
                expect(logger.category).eq("test");
                logger.warn("test warn!!");
            });

            it('onError', function() {
                var b_msg = "test case: bucks";
                var w = function (message, url, line) {
                };
                var b = function (e, bucks) {
                    expect(e.message).equal(b_msg).be.ok;
                };
                var r = function (err) {
                    expect(err.requireType).equal('notloaded').be.ok;
                };

                index.onError(w, b, r);

                // bucks

                var b = new index.Bucks();
                b.add(function () {
                    throw new index.Error(b_msg);
                }).end();

                require("dummy");

            });

            it('beez.Error.extend', function () {
                var CustomError = index.Error.extend(
                    'CustomError',
                    {
                        fn: function () {
                            return "fn";
                        },
                        vars: [1,2,3,4]
                    }
                );
                var custom = new CustomError("Custom Error!!!!");
                expect(custom.message).equal("Custom Error!!!!").be.ok;
                expect(custom.vars.length).equal(4).be.ok;
                expect(custom.fn()).equal("fn").be.ok;
            });

            it('defines', function() {
                expect(window.DEBUG).be.ok;
            });

        });
    };
});
