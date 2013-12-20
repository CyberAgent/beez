/**
 * @name model.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/model
 */

define(['model', 'backbone.localStorage'], function (model, LocalStorage) {

    var Model = model.Model;
    var ModelManager = model.ModelManager;

    var m = new ModelManager('midx');

    var Root = Model.extend('Root', {
        midx: '@',
        defaults: {
            title: '',
            completed: false
        }
    });
    var Test = Model.extend('Test', {
        midx:'test',
        url: function () {
            //return this.urlRoot + '/ping';
            return _.result(this, 'urlRoot') + '/ping';
        },
        defaults: {
            title:'',
            completed:false
        }
    });

    var root, test;

    return function () {

        before(function () {});
        describe('Model to ajax', function () {
            it('new', function () {
                root = m.root(Root);
                test = m.create('/@', Test);
            });

            it('save #1 - POST', function (done) {
                test.set({'success': false});
                test.save(null, {
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('POST');
                    },
                    success: function (model, resp, options) {
                        expect(resp.success === true).be.ok;
                    },
                    error: function (model, resp, options) {
                        assert.fail('fatch #1 error');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });

            });

            it('fetch #1', function (done) {
                test.fetch({
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('GET');
                    },
                    success: function (model, resp, options) {
                        expect(resp.success === true).be.ok;
                    },
                    error: function (model, resp, options) {
                        assert.fail('fatch #1 error');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('fetch #2 - async', function (done) {
                test
                    .async()
                    .fetch({
                        beforeSend: function (xhr, settings) {
                            expect(xhr.readyState === 0).be.ok;
                            expect(settings.type).eq('GET');
                        },
                        success: function (model, resp, options) {
                            expect(resp.success === true).be.ok;
                        },
                        error: function (model, resp, options) {
                            assert.fail('fatch #1 error');
                        },
                        complete: function (xhr, status) {
                            done();
                        }
                    })
                    .end()
                ;
            });

            it('save #2 - PUT', function (done) {
                test.set({'success': false});
                test.save(null, {
                    emulateHTTP: false,
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('PUT');
                    },
                    success: function (model, resp, options) {
                        expect(resp.success === true).be.ok;
                    },
                    error: function (model, resp, options) {
                        assert.fail('fatch #1 error');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });

            });

            it('save #2 - PUT->POST', function (done) {
                test.set({'success': false});
                test.save(null, {
                    emulateHTTP: true,
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('POST');
                    },
                    success: function (model, resp, options) {
                        expect(resp.success === true).be.ok;
                    },
                    error: function (model, resp, options) {
                        assert.fail('fatch #1 error');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });

            });
        });
    };
});
