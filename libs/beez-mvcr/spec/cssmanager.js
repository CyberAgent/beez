/**
 * @name cssmanager.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/cssmanager.js
 */

define(['cssmanager', 'beez.core'], function(cssmanager, beez){
    var CSSManager = cssmanager.CSSManager;

    var css = new CSSManager();
    var name = 'styl/bootstrap/bootstrap.min.css';

    return function () {
        describe('beez-mvcr/cssmanager.js', function(){
            it('name', function() {
                expect(CSSManager.name).eq('beez_mvcr_CSSManager').be.ok;
            });
            it('_basePath', function() {
                expect(css._basePath).eq(beez.config.url.base).be.ok;
            });
            it('load (check through 404 not found.)', function(done) {
                css
                    .async()
                    .load(name)
                    .then(function() {
                        var styles = $('link[rel=stylesheet]');
                        expect(_.any(styles, function (obj) {
                            return obj.href.indexOf(name) !== -1;
                        })).to.be.ok;
                        done();
                    })
                    .error(function onError(e, next) {
                        expect('timeout').be.ok;
                        done();
                    })
                    .end()
                ;

            });
            it('name2path', function() {
                expect(css.name2path(name)).eq(css._basePath + '/' + name);
            });
            it('remove', function() {
                css.remove(name);
                var styles = $('link[rel=stylesheet]');
                expect(_.any(styles, function (obj) {
                    return obj.href.indexOf(name) !== -1;
                })).not.to.be.ok;
            });
            it('dispose', function () {
                expect(css._basePath).be.ok;
                css.dispose();
                expect(css._basePath).not.be.ok;
            });
        });
    };
});
