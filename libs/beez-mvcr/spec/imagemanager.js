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

    var imgUrl = 'https://aos.a4c.jp/sasuke/d/1.0.6/wear/common/underwearFemale/base_pk_1304/img/8/wear_common_underwearFemale-base_pk_1304-8_10.png';
    var imgUrls = [
        'https://aos.a4c.jp/sasuke/d/1.0.6/wear/common/underwearFemale/base_pk_1304/img/8/wear_common_underwearFemale-base_pk_1304-8_13.png', // *1
        'https://aos.a4c.jp/sasuke/d/1.0.6/wear/common/underwearFemale/base_pk_1304/img/8/wear_common_underwearFemale-base_pk_1304-8_15.png', // *2
        'https://aos.a4c.jp/sasuke/d/1.0.6/wear/common/underwearFemale/base_pk_1304/img/8/wear_common_underwearFemale-base_pk_1304-8_15.png', // *3
        'https://aos.a4c.jp/sasuke/d/1.0.6/wear/common/underwearFemale/base_pk_1304/img/8/wear_common_underwearFemale-base_pk_1304-8_15.png' // *4
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
                        expect(loadImg.crossOrigin).eq('Anonymous').be.ok;
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
                                    expect(res.res[i].src).eq(imgUrls[i] + '?_=beez');
                                    break;
                                case 2:
                                    expect(res.res[i].src).eq(imgUrls[i] + '?cachekey=beez');
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
