/**
 * @name imagemanager.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/imagemanager.js
 */

define(['imagemanager'], function (imagemanager) {
    var options = {
        size: 10,
        pool: {
            crossOrigin: 'Anonymous'
        }
    };

    var ImageManager = imagemanager.ImageManager;
    var manager = new ImageManager(options);

    var imgUrl = 'http://0.0.0.0:1109/m/beez/design/beez_200x200.png';
    var imgUrls = [
        'http://0.0.0.0:1109/m/beez/design/beez_400x400.png', // *1
        'http://0.0.0.0:1109/m/beez/design/beez_400x400.png?_=' + Date.now(), // *2
        'http://0.0.0.0:1109/m/beez/design/beez_400x400.png?_=' + Date.now(), // *3
        'http://0.0.0.0:1109/m/beez/design/beez_400x400.png?_=' + Date.now() // *4
    ];
    var imgUrls_options = [
        {crossOrigin: "Anonymous"}, // *1
        //{}, // *1
        {crossOrigin: "Anonymous", "cacheId": "beez"}, // *2
        {crossOrigin: "Anonymous", "cacheKey": "cachekey", "cacheId": "beez"}, // *3
        {/** empty */} // *4
    ];

    var loadImg;

    return function () {
        describe('ImageManager', function () {
            it('loadOne', function (done) {

                manager
                    .loadOne(imgUrl)
                    .then(function (res, next) {
                        expect(res.src).eq(imgUrl);
                        loadImg = res;
                        expect(loadImg.crossOrigin).eq('anonymous').be.ok;
                        done();
                    }).error(function (err, next) {
                        throw new Error(err);
                        done();
                    })
                    .end()
                ;
            });

            it('pool', function () {
                expect(manager.pool.limit).eq(options.size);
                expect(manager.pool._total).eq(1);
                expect(manager.pool._num_used).eq(1);
                expect(manager.pool._unused.length).eq(0);
                expect(manager.pool.options.crossOrigin).eq('Anonymous').be.ok;
            });
            it('living', function () {
                expect(manager.living()).eq(1);
            });
            it('peak', function () {
                expect(manager.peak()).eq(1);
            });
            it('waiting', function () {
                expect(manager.waiting()).eq(0);
            });
            it('load', function (done) {
                manager
                    .load(imgUrls, imgUrls_options)
                    .then(function (res, next) {
                        for (var i = 0; i < res.res.length; i++) {
                            expect((res.err[i] === null)).be.ok;
                            switch (i) {
                                case 0:
                                    expect(res.res[i].src).eq(imgUrls[i]);
                                    break;
                                case 1:
                                    expect(res.res[i].src).eq(imgUrls[i] + '&_=beez');
                                    break;
                                case 2:
                                    expect(res.res[i].src).eq(imgUrls[i] + '&cachekey=beez');
                                    break;
                                case 3:
                                    expect(res.res[i].src).eq(imgUrls[i]);
                                    break;
                            }
                        }
                        done();
                    }).error(function (err, next) {
                        expect(false).be.ok;
                        done();
                    })
                    .end()
                ;
            });
            it('imageUrl', function () {
                var url = 'http://www.cyberagent.co.jp/test-${raito}.png';
                var res = manager.imageUrl(url);
                expect(url.replace('${ratio}', window.devicePixelRatio * 10)).eq(url);
            });
            it('dispose', function () {
                manager.dispose();
                expect((manager.pool === undefined)).be.ok;
            });
        });
    };
});
