/**
 * @name timer.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-utils/timer
 */

define(['timer'], function(Timer){
    var t = new Timer();
    this.hoge = "hoge";
    var self = this;

    return function() {
        describe('timer', function(){
            it('addInterval', function(done) {
                var count = 0;
                t.addInterval(function dummy(_dummy) {
                    expect(_dummy.dummy).be.ok;
                    expect(this.context.dummy).be.ok;
                    t.clearInterval(this.timer_id);
                    expect(self.hoge).equal("hoge").be.ok;
                    done();
                }, 100, {dummy:true});
            });
            it('addTimeout', function(done) {
                t.addTimeout(function dummy(_dummy) {
                    if (_dummy || this.context) {
                        expect("context arguments error.").not.be.ok;
                    };
                    expect(self.hoge).equal("hoge").be.ok;
                    expect(_.keys(t._callbacks).length).eq(1);
                    done();
                }, 100);
            });
        });
    };
});
