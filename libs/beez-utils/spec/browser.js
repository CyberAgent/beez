/**
 * @name browser.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-utils/browser
 */

define(['browser'], function(Browser){
    var b = new Browser();

    return function() {
        describe('browser', function(){
            it('ua', function() {
                expect(b.ua).be.ok;
            });

            it('getComputedStyle', function() {
                expect(b.getComputedStyle($('body')[0])).be.ok;
            });

            it('getWindowSize', function() {
                expect(b.getWindowSize().width).be.ok;
                expect(b.getWindowSize().height).be.ok;
            });

            it('startHandleOrientation', function() {
                // TODO
            });

            it('getlanguage', function() {
                var lang = b.getLanguage();
                console.log(lang)
                expect(lang.length).eq(2).be.ok;
            });

            it('hideAddress async', function(done) {
                var async = b.async();
                async
                    .hideAddress(50)
                    .then(function(obj) {
                        // TODO
                        done();
                    })
                    .error(function (err, next) {
                        throw new Error('hideAddress error.');
                        done();

                    })
                    .end()
                ;
            });

        });
    };
});
