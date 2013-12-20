/**
 * @name direct2ajax.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/direct2ajax
 */

define(['model', 'backbone.localStorage'], function (model, LocalStorage) {

    var Model = model.Model;
    var ModelManager = model.ModelManager;

    var m = new ModelManager('midx');

    return function () {
        describe('ajax', function() {
            it('$get', function(done) {
                m.$get({
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('GET');
                    },
                    success: function (data, status, xhr) {
                        expect(data.success === true).be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$get');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('$post', function(done) {
                m.$post({
                    emulateHTTP: false,
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('POST');
                    },
                    success: function (data, status, xhr) {
                        expect(status).eq('success').be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$post');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('$put', function(done) {
                m.$put({
                    emulateHTTP: false,
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('PUT');
                    },
                    success: function (data, status, xhr) {
                        expect(status).eq('success').be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$put');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('$put #2', function(done) {
                m.$put({
                    emulateHTTP: true,
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('POST');
                    },
                    success: function (data, status, xhr) {
                        expect(status).eq('success').be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$put #2');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('$delete', function(done) {
                m.$delete({
                    emulateHTTP: false,
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('DELETE');
                    },
                    success: function (data, status, xhr) {
                        expect(status).eq('success').be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$delete');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });
            it('$patch', function(done) {
                m.$patch({
                    emulateHTTP: false,
                    url: '/ping',
                    beforeSend: function (xhr, settings) {
                        expect(xhr.readyState === 0).be.ok;
                        expect(settings.type).eq('PATCH');
                    },
                    success: function (data, status, xhr) {
                        expect(status).eq('success').be.ok;
                    },
                    error: function (xhr, type, error) {
                        assert.fail('$patch');
                    },
                    complete: function (xhr, status) {
                        done();
                    }
                });
            });

        });
    };
});
