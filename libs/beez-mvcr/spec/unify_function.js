/* global: define, it, describe, expect, $ */
/**
 * @name unify_function.js<spec/unify_function>
 * @author HIRAKI Satoru <hiraki_satoru@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/unify_function.js
 */

define(['base', 'view', 'model', 'backbone.localStorage'], function (base, view, model, LocalStorage) {
    var ManagerBase = base.ManagerBase;
    var Base = base.Base;
    var Model = model.Model;
    var ModelManager = model.ModelManager;
    var Collection = model.Collection;
    var mManager = new ModelManager('midx');
    var View = view.View;
    var ViewManager = view.ViewManager;
    var vManager = new ViewManager('vidx');

    var managerBase;

    return function () {
        var obj    = { vidx: '@', add: true, prefix: '/@' };
        var obj2   = { vidx: 'obj2', add: true, prefix: 'obj2' };

        var TestRootModel = Model.extend('TestRootModel', {
            midx: '@',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestRootModel.__super__.dispose.apply(this);
            }
        });
        var TestModel = Model.extend('TestModel', {
            midx: 'test',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel.__super__.dispose.apply(this);
            }
        });

        var TestModel1 = Model.extend('TestModel1', {
            midx: 'test1',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel1.__super__.dispose.apply(this);
            }
        });

        var TestModel2 = Model.extend('TestModel2', {
            midx: 'test2',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel2.__super__.dispose.apply(this);
            }
        });
        var TestModel3 = Model.extend('TestModel3', {
            midx: 'test3',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel3.__super__.dispose.apply(this);
            }
        });
        var TestModel4 = Model.extend('TestModel4', {
            midx: 'test4',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel4.__super__.dispose.apply(this);
            }
        });

        var TestModel5 = Model.extend('TestModel5', {
            midx: 'test5',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec'),
            flag: false,
            urlRoot: 'http://0.0.0.0:1109/p',
            dispose: function () {
                this.flag = true;
                TestModel5.__super__.dispose.apply(this);
            }
        });


        var TestCollection = Collection.extend('TestCollection', {
            midx: 'tests',
            model: TestModel,
            localStorage: new LocalStorage('beez-spec-Collection'),
            flag: false,
            dispose: function () {
                this.flag = true;
                TestCollection.__super__.dispose.apply(this);
            }
        });

        var TestCModel = Model.extend('TestCModel', {
            midx: 'ctest',
            defaults: {title: '', completed: false},
            localStorage: new LocalStorage('beez-spec-Collection'),
            flag: false,
            dispose: function () {
                this.flag = true;
                TestCModel.__super__.dispose.apply(this);
            }
        });

        var TestView = View.extend('test.view.TestView', {
            vidx: '@',
            id: '__test_view_testview_render__',
            order: 0,
            initialize: function (obj) {
                if (obj) {
                    this.foo = obj.foo || false;
                }
            },
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test_view_testview_render__" class="hello">Hello!!</div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            events: {
                'dblclick': 'onDblClick'
            },
            afterOnce: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.afterOnce = true;
                    done(true);
                }, 100);
            },
            after: function () {
                this.test.show.after = true;
            },
            before: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.before = true;
                    done(true);
                }, 100);
            },
            beforeOnce: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.beforeOnce = true;
                    done(true);
                }, 100);
            },
            onDblClick: function () {
                this.test.events.dblclick = true;
            },
            test: {
                events: {
                    'dblclick': false
                },
                show: {
                    after: false,
                    afterOnce: false,
                    before: false,
                    beforeOnce: false
                }
            }
        });
        var TestView1 = View.extend('test.view.TestView1', {
            vidx: 'testVidx1',
            id: '__test_view_testview_render1__',
            order: 1,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test1__">Hello!! - 1 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            remove: function remove() {
                console.log('TestView1 is removed');
                TestView1.__super__.remove.apply(this);
            }
        });
        var TestView2 = View.extend('test.view.TestView2', {
            vidx: 'testVidx2',
            id: '__test_view_testview_render2__',
            order: 2,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test2__">Hello!! - 2 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            remove: function remove() {
                console.log('TestView2 is removed');
                TestView2.__super__.remove.apply(this);
            }
        });
        var TestView3 = View.extend('test.view.TestView3', {
            vidx: 'testVidx3',
            id: '__test_view_testview_render3__',
            order: 3,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test3__">Hello!! - 3 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            dispose: function dispose() {
                console.log('TestView3 is disposed!');
            }
        });
        var TestView4 = View.extend('test.view.TestView4', {
            vidx: 'testVidx4',
            id: '__test_view_testview_render4__',
            order: 4,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test4__">Hello!! - 4 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            dispose: function dispose() {
                console.log('TestView4 is disposed');
                TestView4.__super__.dispose.apply(this);
            }
        });
        var TestView5 = View.extend('test.view.TestView5', {
            vidx: 'testVidx5',
            id: '__test_view_testview_render4__',
            order: 5,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test5__">Hello!! - 5 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            dispose: function dispose() {
                console.log('TestView5 is disposed');
                TestView5.__super__.dispose.apply(this);
            }
        });
        var TestView6 = View.extend('test.view.TestView6', {
            vidx: 'testVidx6',
            id: '__test_view_testview_render4__',
            order: 6,
            $el: $('#__temp__'),
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test6__">Hello!! - 6 </div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            dispose: function dispose() {
                console.log('TestView6 is disposed');
                TestView6.__super__.dispose.apply(this);
            }
        });

        var testView, testModel1, testModel2, testModel3, testModel4, testModel5, testView1, testView2, viewRoot, viewRoot2,
            testViewManager1, testViewManager2, testViewManager3, testViewManager4, testViewManager5, testViewManager6, model, model2, collection;

        describe('ManagerBase', function () {
            it('constructor: function constructor(idxProp) {', function () {
                managerBase = new ManagerBase('vidx');
                expect(managerBase._idxProp).equals('vidx').be.ok;
                expect(managerBase.objs['vidx']).equals('$').be.ok;
            });

            it('add #1', function () {
                var manager = managerBase.add('/', obj);
                expect(manager.objs[obj.vidx].add).eq(true);
                expect(manager.objs[obj.vidx].prefix).eq('/');
                expect(manager.objs[obj.vidx].vidx).eq(obj.vidx);
            });

            it('remove', function () {
                var manager = managerBase.add('/@', obj2);

                manager.remove('/@/obj2');
                expect(managerBase.trace()).not.have.property('/@/obj2');
                manager = managerBase.add('/@', obj2);
            });

            it('dispose', function () {
                expect(managerBase.objs).be.ok;
                expect(managerBase._idxProp).be.ok;

                managerBase.dispose();

                expect(managerBase.objs).not.be.ok;
                expect(managerBase._idxProp).not.be.ok;
            });
        });
        before(function () {
            console.log('localStorage is cleared');
            localStorage.clear();    // prepared for failing test.
        });
        describe('Model', function () {
            it('set/fetch/save/destroy sync', function () {
                for (var i = 0; i < 10; i++) {
                    var t = new TestModel();
                    t.set('title', 'aaaaa' + i);
                    t.fetch();
                    t.save();
                    t.destroy();
                    t.fetch();
                }
                expect(localStorage.getItem("beez-spec")).not.be.ok; // browser api
            });
            it('fetch #1', function (done) {
                testModel1 = new TestModel();
                testModel1.set('title', 'taro');
                testModel1
                    .async()
                    .fetch()
                    .then(function(res, next) {
                        expect(res.model.constructor.name).eq('TestModel');
                        done();
                    })
                    .error(function(err, next) {
                        throw new Error("fetch error. #1");
                        done();
                    })
                    .end()
                ;
            });

            it('save', function (done) {
                testModel1.save({title: 'I am TestModel!!'});

                testModel1
                    .async()
                    .save()
                    .then(function(res, next) {
                        expect(res.model.get('title')).eq('I am TestModel!!').be.ok
                        expect(res.model.attributes.title).eq('I am TestModel!!');
                        //expect(res.model._manager._idxProp).eq('midx');
                        expect(res.model.urlRoot).eq('http://0.0.0.0:1109/p');
                        done();
                    })
                    .error(function(err, next) {
                        throw new Error("save error.");
                        done();
                    })
                    .end()
                ;
            });
            it('destroy', function (done) {
                testModel1
                    .async()
                    .destroy()
                    .then(function(res, next) {
                        expect(res.model.constructor.name).eq('TestModel');
                        done();

                    }).error(function(err, next) {
                        throw new Error("destroy error.");
                        done();
                    }).end()
                ;
            });
            it('fetch #2', function (done) {
                testModel1
                    .async()
                    .fetch()
                    .then(function(res, next) {
                        throw new Error("fetch error. #2");
                        done();

                    }).error(function(err, next) {
                        done();
                    })
                    .end()
                ;
            });
            it('remove', function () {
                testModel2 = new TestModel2();
                expect(testModel2.remove).throw('Use Backbone.model.destroy() or Model.dipose() instead of this');
            });
            it('diespose', function () {
                testModel3 = new TestModel3();

                testModel3.dispose();
                expect(testModel3).not.have.property('manager');
                expect(testModel3).not.have.property('cid');
                expect(testModel3).not.have.property('attributes');
                expect(testModel3).not.have.property('collection');
            });
        });

        before(function () {
            console.log('localStorage is cleared');
            localStorage.clear();    // prepared for failing test.
        });
        describe('Collection', function () {
            var c;
            it('new/create/destroy/fetch sync', function () {
                c = new TestCollection();
                var testcmodel1 = new TestCModel();
                testcmodel1.set('title', 'bbbbb');
                c.create(testcmodel1);
                expect(c.length).eq(1);

                testcmodel1.destroy();
                ///c.fetch();

                expect(c.length).eq(0);
            });

            it('midx', function () {
                expect(c.midx).eq('tests');
            });

            it('async', function () {
                c = new TestCollection();
                var testcmodel1 = new TestCModel();
                testcmodel1.set('title', 'aaaaa');
                c
                .async()
                .create(testcmodel1)
                .then(function (res, next) {
                    expect(c.length).eq(1);
                })
                .dispose();
                expect(c.length).eq(0);
            });
            it('remove', function () {
                c = new TestCollection();
                var testcmodel1 = new TestCModel();
                testcmodel1.set('title', 'bbbbb');
                c.create(testcmodel1);
                expect(c.models.length).eq(1);
                c.remove(testcmodel1);
                expect(c.models.length).eq(0);
            });
            it('removeAll', function () {
                c = new TestCollection();
                var testcmodel1 = new TestCModel();
                var testcmodel2 = new TestCModel();
                testcmodel1.set('title', 'aaaaa');
                testcmodel2.set('title', 'bbbbb');
                c.create(testcmodel1);
                c.create(testcmodel2);
                expect(c.models.length).eq(2);
                c.removeAll();
                expect(c.models.length).eq(0);
            });
            it('dispose', function () {
                c = new TestCollection();
                var testcmodel1 = new TestCModel();
                var testcmodel2 = new TestCModel();
                testcmodel1.set('title', 'aaaaa');
                testcmodel2.set('title', 'bbbbb');
                c.create(testcmodel1);
                c.create(testcmodel2);
                expect(c.models.length).eq(2);
                c.dispose();
                expect(c).not.have.property('manager');
                expect(c).not.have.property('comparator');
                expect(c).not.have.property('length');
                expect(c).not.have.property('models');
                expect(c).not.have.property('collection');
            });
        });

        describe('View', function () {
            it('constructor', function () {
                testView = new TestView(vManager, {'foo': true});
                expect(testView.constructor.name).eq('test_view_TestView');
            });
            it('member variable', function () {
                expect(testView.$).be.ok;
                expect(testView.$el).be.ok;
                expect(testView.order).eq(0);
                expect(testView.foo).be.ok;
                expect(testView.visible).be.ok;
                expect(testView.manager).be.ok;
                expect(testView.vidx).eq('@');
            });
            it('remove', function () {
                testView1 = new TestView1(vManager, {'test': true});
                testView1.render();
                expect($('#__temp__').children()).have.length(1);
                testView1.remove();
                expect($('#__temp__').children()).have.length(0);
            });
            it('dispose', function () {
                testView.render();
                expect($('#__temp__').children()).have.length(1);

                testView.dispose();
                expect($('#__temp__').children()).have.length(0);

                expect(testView).not.have.property('manager');
                expect(testView).not.have.property('state');
                expect(testView).not.have.property('visible');
                expect(testView).not.have.property('cid');
                expect(testView).not.have.property('options');
                expect(testView).not.have.property('$el');
                expect(testView).not.have.property('model');
                expect(testView).not.have.property('collection');
                expect(testView).not.have.property('el');
                expect(testView).not.have.property('attributes');
                expect(testView).not.have.property('className');
            });
        });

        describe('ViewManager', function () {
            it('constructor', function () {
                viewRoot = vManager.root(TestView);
                testViewManager1 = vManager.create('/@', TestView1, {'test': true});
                testViewManager2 = vManager.create('/@/testVidx1', TestView2, {'test': true});
                expect(vManager.get('/@/testVidx1').vidx).be.eq('testVidx1');
                expect(vManager.get('/@/testVidx1/testVidx2').vidx).be.eq('testVidx2');
            });
            it('remove', function () {
                vManager.remove('/@/testVidx1/testVidx2');
                expect(vManager.get('/@')).have.property('testVidx1');
                expect(vManager.get('/@/testVidx1')).not.have.property('testVidx2');
            });
            it('remove test console', function () {
                console.log('!!!!!');
            });
            it('dispose', function () {
                testViewManager3 = vManager.create('/@', TestView3, {'test': true});
                testViewManager4 = vManager.create('/@/testVidx3', TestView4, {'test': true});
                testViewManager5 = vManager.create('/@/testVidx3', TestView5, {'test': true});
                testViewManager6 = vManager.create('/@/testVidx3/testVidx4', TestView6, {'test': true});

                vManager.dispose();
                expect(vManager).be.empty;
            });
            it('dispose test console', function () {
                console.log('!!!!!');
            });
        });

        describe('ModelManager', function () {
            it('_idxProp: "midx"', function () {
                expect(mManager._idxProp).eq('midx');
            });
            it('objs: Object', function () {
                expect(mManager.objs.midx).eq('$');
            });

            it('root', function () {
                var model = mManager.root(TestRootModel);
                expect(mManager.get('/@')).be.ok;
            });

            it('create async', function (done) {
                //
                mManager.async().create('/@', TestModel).then(function () {
                    expect(mManager.get('/@/test')).be.ok;
                    done();
                }).error(function (err, next) {
                    console.log(err);
                    console.log(next);
                    done();
                    throw new Error('mManager.create error.');
                }).end();
            });
            it('create', function () {
                mManager.create('/@', TestModel1, {
                    title: 'TestModel1 created by manager.'
                }, {
                    urlRoot: 'http://0.0.0.0:3000/test1'
                });
                mManager.create('/@', TestModel2, {
                    title: 'TestModel2 created by manager.'
                }, {
                    urlRoot: 'http://0.0.0.0:4000/test2'
                });

                expect(mManager.get('/@/test1')).be.ok;
                expect(mManager.get('/@/test2')).be.ok;
                expect(mManager.get('/@/test1').attributes.title).be.eq('TestModel1 created by manager.');
                expect(mManager.get('/@/test2').attributes.title).be.eq('TestModel2 created by manager.');
                expect(mManager.get('/@/test1').urlRoot).be.eq('http://0.0.0.0:3000/test1');
                expect(mManager.get('/@/test2').urlRoot).be.eq('http://0.0.0.0:4000/test2');
            });
            it('createCollection/isModel/isCollection', function () {
                model = new TestModel3({
                    'title': 'Collection in TestModel3!!'
                }, {
                    urlRoot: 'http://0.0.0.0.:5000/test'
                });
                model2 = new TestModel4({'title': 'Collection in TestModel4!!'});
                collection = mManager.createCollection('/@', TestCollection, [model, model2]);
                var col = mManager.get('/@/tests');
                expect(col.length).eq(2);
                expect(col.prefix).eq('/@');
                expect(col.midx).eq('tests');
                expect(col.models[0].get('title')).eq('Collection in TestModel3!!');
                expect(col.models[1].get('title')).eq('Collection in TestModel4!!');

                expect(model.isModel()).be.ok;
                expect(model.isCollection()).not.be.ok;

                expect(model2.isModel()).be.ok;
                expect(model2.isCollection()).not.be.ok;

                expect(collection.isModel()).not.be.ok;
                expect(collection.isCollection()).be.ok;
            });
            it('collection remove', function () {
                mManager.remove('/@/tests', {silent: true});

                expect(mManager.get('/@')).not.have.property('tests');
                expect(collection.models).eql([]);
            });
            it('remove', function () {
                mManager.create('/@', TestModel3);
                mManager.create('/@', TestModel4);
                mManager.create('/@/test4', TestModel5);

                // mManager.get('/@/test4/test5').bind('change', function () {
                //     console.log('change');
                // });
                expect(mManager.get('/@/test3').isBinded).be.ok;
                expect(mManager.get('/@/test4').isBinded).be.ok;
                // mManager.get('/@/test4/test5').isBinded).not.be.ok;
                mManager.remove('/@/test3');
                mManager.remove('/@/test4');

                expect(mManager.get('/@')).have.property('test');
                expect(mManager.get('/@')).have.property('test2');
                expect(mManager.get('/@')).not.have.property('test3');
                expect(mManager.get('/@')).not.have.property('test4');
                expect(mManager.get('/@')).not.have.property('test4.test5');
            });
            it('dispose', function () {
                mManager.create('/@', TestModel4);
                mManager.create('/@/test4', TestModel5);
                console.log('mManager on before dispose: ', mManager);
                console.log('mManager.trace on before dispose: ', mManager.trace());

                mManager.dispose();

                console.log('mManager on after dispose: ', mManager);
                console.log('mManager.trace on after dispose: ', mManager.trace());

                expect(mManager.trace()).not.have.property('/@');
                expect(mManager.trace()).not.have.property('/@/test1');
                expect(mManager.trace()).not.have.property('/@/test4');
                expect(mManager.trace()).not.have.property('/@/test4/test5');
                expect(mManager.trace()).not.have.property('/@/tests');
                expect(mManager).be.empty;

            });
        });
    };
});
