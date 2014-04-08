/**
 * @name model.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/model
 */

define(['model', 'backbone.localStorage'], function(model, LocalStorage){

    var Collection = model.Collection;
    var Model = model.Model;
    var ModelManager = model.ModelManager;

    //var manager = model.manager;
    var manager = new ModelManager('midx');

    var TestRootModel = Model.extend('TestRootModel', {
        midx: '@', defaults: {title: '', completed: false}, localStorage: new LocalStorage('beez-spec'), flag: false, urlRoot: 'http://0.0.0.0:1109/p',
        dispose: function() { this.flag = true; TestRootModel.__super__.dispose.apply(this); }
    });
    var TestModel = Model.extend('TestModel', {
        midx:'test', defaults:{title:'',completed:false}, localStorage:new LocalStorage('beez-spec'), flag:false, urlRoot:'http://0.0.0.0:1109/p',
        dispose:function () { this.flag=true; TestModel.__super__.dispose.apply(this);}
    });
    var TestModel1 = Model.extend('TestModel1', {
        midx:'test1', defaults:{title:'',completed:false}, localStorage:new LocalStorage('beez-spec'), flag:false, urlRoot:'http://0.0.0.0:1109/p',
        dispose: function () { this.flag=true; TestModel1.__super__.dispose.apply(this); }
    });
    var TestModel2 = Model.extend('TestModel2', {
        midx:'test2', defaults:{title:'',completed:false}, localStorage:new LocalStorage('beez-spec'), flag:false, urlRoot:'http://0.0.0.0:1109/p',
        dispose:function(){ this.flag=true; TestModel2.__super__.dispose.apply(this); }
    });
    var TestModel3 = Model.extend('TestModel3', {
        midx:'test3', defaults:{title:'',completed:false}, localStorage:new LocalStorage('beez-spec'), flag:false, urlRoot:'http://0.0.0.0:1109/p',
        dispose:function () { this.flag=true; TestModel3.__super__.dispose.apply(this);}
    });
    var TestCollection = Collection.extend('TestCollection', {
        midx:'tests', model:TestModel, localStorage:new LocalStorage('beez-spec-Collection'), flag:false,
        dispose:function(){ this.flag=true; TestCollection.__super__.dispose.apply(this); }
    });
    var TestCModel = Model.extend('TestCModel', {
        midx:'ctest', defaults:{title:'',completed:false}, localStorage:new LocalStorage('beez-spec-Collection'), flag:false,
        dispose:function(){ this.flag=true; }
    });

    var model1, collection1, testModel1;

    return function () {

        before(function () {
            console.log('localStorage is cleared');
            window.localStorage.removeItem('beez-spec');
            window.localStorage.removeItem('beez-spec-Collection');
            localStorage.clear(); // prepared for failing test.
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
                    .then(function(res) {
                        expect(res.model.get('title')).eq('I am TestModel!!').be.ok
                        expect(res.model.attributes.title).eq('I am TestModel!!');
                        //expect(res.model._manager._idxProp).eq('midx');
                        expect(res.model.urlRoot).eq('http://0.0.0.0:1109/p');
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
            it('isBinded', function () {
                var model1 = new TestModel();
                var model2 = new TestModel();
                var model3 = new TestModel();

                model1.listenTo(model2, 'sync', beez.none);
                model3.listenTo(model3, 'sync', beez.none);
                expect(model1.isBinded()).be.not.ok;
                expect(model2.isBinded()).be.ok;
                expect(model3.isBinded()).be.not.ok;
            });
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

            it('create async', function (done) {
                var cmodel1 = new TestCModel();
                cmodel1.set('title', "1");
                var cmodel2 = new TestCModel();
                cmodel2.set('title', "2");

                c.async().create(cmodel1).create(cmodel2).then(function() {
                    expect(c.models.length).eq(2);
                    expect(localStorage.getItem('beez-spec-Collection').split(",").length).eq(2);
                    cmodel1.destroy();
                    cmodel2.destroy();

                    //c.fetch();
                    expect(c.models.length).eq(0);
                    expect(localStorage.getItem('beez-spec-Collection').split(",").length).eq(1); // empty
                    done();
                }).error(function(err, next) {
                    throw new Error("create error. async");
                    done();
                }).end()
                ;
            });
            it('isBinded', function () {
                var cmodel1 = new TestCModel();
                var cmodel2 = new TestCModel();
                var cmodel3 = new TestCModel();

                cmodel1.listenTo(cmodel2, 'sync', beez.none);
                cmodel3.listenTo(cmodel3, 'sync', beez.none);
                expect(cmodel1.isBinded()).be.not.ok;
                expect(cmodel2.isBinded()).be.ok;
                expect(cmodel3.isBinded()).be.not.ok;
            });
        });

        describe('manager', function () {

            it('_idxProp: "midx"', function () {
                expect(manager._idxProp).eq('midx');
            });
            it('objs: Object', function () {
                expect(manager.objs.midx).eq('$');
            });

            it('root', function () {
                var model = manager.root(TestRootModel);
                expect(manager.get('/@')).be.ok;
            });

            it('create async', function (done) {
                //
                manager.async().create('/@', TestModel).then(function() {
                    expect(manager.get('/@/test')).be.ok;
                    done();
                }).error(function(err, next) {
                    console.log(err);
                    console.log(next);
                    throw new Error('manager.create error.');
                    done();
                }).end();;
            });
            it('create', function () {
                expect(manager.create('/@', TestModel1)).be.ok;
                expect(manager.get('/@/test1')).be.ok;
                expect(manager.create('/@', TestModel2)).be.ok;
                expect(manager.get('/@/test2')).be.ok;
            });
            it('createCollection', function () {
                var model = new TestModel3({'title': 'Collection in TestModel!!'});
                manager.createCollection('/@', TestCollection, [model]);
                var col = manager.get('/@/tests');
                expect(col.length).eq(1);
                expect(col.prefix).eq('/@');
                expect(col.midx).eq('tests');
                expect(col.models[0].get('title')).eq('Collection in TestModel!!');

                // remove
                col.each(function (model) {
                    col.remove(model);
                }, this);
                expect(col.length).eq(0);
            });
            it('dispose: function dispose(path) {', function () {
                manager.dispose('/@/test2');
                if (manager.get('/@/test2')) {
                    throw new Error('/@/test2 dispose error');
                }
            });
        });
        describe('ModelManager', function () {
            it('TODO', function () {
                // TOOD
            })
        });
    };
});
