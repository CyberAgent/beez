/**
 * @name uid.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-utils/uid.js
 */

define(['uid'], function(UID){
    var uid = new UID();

    return function() {
        describe('UID', function(){
            it('create', function() {
                expect(uid.create()).be.ok;
            });
        });
    };
});
