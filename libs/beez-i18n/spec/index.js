/**
 * @name index.js<spec/index>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-i18n/index
 */

define(['index', 'beez.core'], function(I18n, beez){
    var _ = beez.vendor._;

    var SpecI18n = I18n.extend(
        'spec.i18n',
        {
            dummy: function () {
                return true;
            }
        }
    );
    var i18n = undefined;

    return function() {
        describe('i18n', function(){

            it('new', function() {
                i18n = beez.i18n.setup({
                    lang: {
                        base: 'uk'
                    },
                    message: {
                        uk: {
                            'hello': 'привіт'
                        }
                    }
                }, SpecI18n);

                // already setup
                i18n = beez.i18n.setup({
                    lang: {
                        base: 'uk'
                    },
                    message: {
                        uk: {
                            'hello': 'привіт'
                        }
                    }
                }, SpecI18n);


                expect(i18n.dummy()).be.ok;
                expect(i18n.constructor.name).eq('spec_i18n').be.ok;
                expect(i18n.lang.base).eq('uk').be.ok;
                expect(i18n.lang.use).eq(beez.utils.browser.getLanguage()).be.ok;
            });
            it('addMessage', function() {
                var res = i18n.addMessage('ja', {
                    'hello': 'こんにちは',
                    'test': 'テスト'
                });
                expect(res.hello).eq('こんにちは').be.ok;
                expect(res.test).eq('テスト').be.ok;
            });

            it('remove + __', function() {
                i18n.lang.use = 'ja';
                var res = i18n.addMessage('ja', {
                    'hello1': 'こんにちは1',
                    'test1': 'テスト1'
                });

                i18n.remove('ja', 'hello1');
                expect(i18n.__('hello1')).not.be.ok;
                expect(i18n.__('test1')).eq('テスト1').be.ok;

                i18n.remove('ja');
                expect(i18n.__('test1')).not.be.ok;
            });

            it('add', function() {
                i18n.lang.use = 'ja';
                var res = i18n.add({
                    'ja': {
                        'hello2': 'こんにちは2',
                        'test2': 'テスト2'
                    },
                    'en': {
                        'hello2': 'hello2',
                        'test2': 'test2'
                    }
                });

                expect(i18n.getMessage('hello2')).equal('こんにちは2').be.ok;
                expect(i18n.getMessage('test2')).equal('テスト2').be.ok;
            });
            it('getMessage[multi-lang]', function() {
                i18n.remove();
                i18n.lang.use = 'fr';

                var res = i18n.add({
                    'fr': {
                        'hello': 'bonjour',
                        'test': 'test'
                    }
                });
                expect(i18n.getMessage('hello')).equal('bonjour').be.ok;
            });
            it('getMessage dynamic', function() {
                i18n.remove();
                i18n.lang.use = 'ja';

                var res = i18n.add({
                    'ja': {
                        'hello': 'こんにちは {#name} さん [ステータス] : {#status}',
                        'number': 'これは数字の {#num} です'
                    }
                });
                expect(i18n.getMessage('hello', 'fkei', ':)')).equal('こんにちは fkei さん [ステータス] : :)').be.ok;
                expect(i18n.getMessage('number', 0)).equal('これは数字の 0 です').be.ok;
            });
            it ('Irregular case [getMessage()]', function () {
                i18n.remove();
                i18n.lang.use = 'ja';
                i18n.lang.base = 'en';

                var res = i18n.add({
                    'ja': {
                        'hello': 'こんにちは {#name} さん [ステータス] : {#status}',
                        'sign': '!"#$%&\'()=~ {#a} {#b} |{#a}|'
                    },
                    'en': {
                        'hello': 'Hello {#name} [Status] : {#status}',
                        'goodevening': 'Good evening {#name} [Status] : {#status}'
                    }
                });
                expect(i18n.getMessage('hellooo', 'fkei', '元気').length).equal(0);
                expect(i18n.getMessage('sign', 'a', 'b', 'c', 'd')).equal('!"#$%&\'()=~ a b |c|d').be.ok;
                expect(i18n.getMessage('goodevening', 'fkei', ':)')).equal('Good evening fkei [Status] : :)').be.ok;
                console.log("aaaa")
            });
            it('change parseReg', function() {
                i18n.remove();
                i18n.lang.use = 'ja';
                i18n.parseReg = new RegExp(/\##[(0-9a-zA-Z)]*##/);

                var res = i18n.add({
                    'ja': {
                        'hello': 'こんにちは ##name## さん [ステータス] : ##status##'
                    }
                });
                expect(i18n.getMessage('hello', 'fkei', ':)')).equal('こんにちは fkei さん [ステータス] : :)').be.ok;
            });
            it('message override', function() {
                i18n.remove();
                i18n.lang.use = 'ja';
                i18n.add({
                    'ja': {
                        '1': '1'
                    }
                });
                i18n.add({
                    'ja': {
                        '1': '1.1',
                        '2': '2',
                    }
                });
                var keys = _.keys(i18n.message.ja);

                expect(keys[0]).equal('1').be.ok;
                expect(keys[1]).equal('2').be.ok;

                expect(i18n.message.ja[keys[0]]).equal('1.1').be.ok;
                expect(i18n.message.ja[keys[1]]).equal('2').be.ok;

                expect(keys.length).equal(2).be.ok;

            });
            it('dispose', function() {
                i18n.dispose();
                expect(i18n.lang).not.be.ok;
                expect(i18n.message).not.be.ok;
                expect(i18n.parseReg).not.be.ok;
            });

        });

    };
});
