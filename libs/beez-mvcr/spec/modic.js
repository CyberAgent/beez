/**
 * @name modic.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/modic
 */

define(['modic', 'backbone.localStorage'], function(modic, LocalStorage){
    var Modic = modic.Modic;
    var modic = new Modic();

    return function () {
        describe('Modic', function () {
            it('not allowed to use this function.', function () {
                try { modic.async(); expect(false).be.ok; } catch(e) {expect(e).be.ok};
                try { modic.url(); expect(false).be.ok; } catch(e) {expect(e).be.ok};
                try { modic.fetch(); expect(false).be.ok; } catch(e) {expect(e).be.ok};
                try { modic.save(); expect(false).be.ok; } catch(e) {expect(e).be.ok};
            });
        });
    }
});
