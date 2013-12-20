/**
 * @name index.js<spec/index>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-utils/index
 */

define(['index'], function(index){
    return function() {
        describe('index', function(){
            it('Member variable', function() {
                expect(index.browser.constructor.name).eq('beez_utils_Browser');
                expect((typeof index.none)).eq("function");
            });
            it('Member variable pixelRatio', function() {
                expect(index.pixelRatio).eq(window.devicePixelRatio);
            });
            it('copyr', function () {
                var dst = {hoge: {foo: {bar: false}}};
                var src = {hoge: {foo: {bar: true}}};
                var res = index.copyr(dst, src);
                expect(dst.hoge.foo.bar).be.ok;
                expect(src.hoge.foo.bar).be.ok

            });
            it('shortcut is()', function () {
                index.is('Number', 1);
            });

            it('shortcut isObject() with isArray()', function () {
                index.isObject({})
                expect(index.isArray([])).be.ok;

            });

            it('shortcut isXXX() underscore.js', function () {
                // Equal
                var moe   = {name: 'moe', luckyNumbers: [13, 27, 34]};
                var clone = {name: 'moe', luckyNumbers: [13, 27, 34]};
                expect((moe == clone)).not.be.ok;
                index.isEqual(moe, clone);

                // Empty
                expect(index.isEmpty(([1, 2, 3]))).not.be.ok;
                expect(index.isEmpty({})).be.ok;

                // Element
                expect(index.isElement($('body')[0])).be.ok;

                // Arguments
                expect(index.isArguments(arguments)).be.ok;

                // Function
                expect(index.isFunction(function () {})).be.ok;

                // String
                expect(index.isString('Σ(ﾟдﾟlll)ｶﾞｰﾝ')).be.ok;

                // Number
                expect(index.isNumber(1)).be.ok;

                // Finite
                expect(index.isFinite(-101)).be.ok;
                expect(index.isFinite(-Infinity)).not.be.ok;

                // Boolean
                expect(index.isBoolean(true)).be.ok;

                // Date
                expect(index.isDate(new Date())).be.ok;

                // RegExp
                expect(index.isRegExp(/^$/)).be.ok;

                // NaN
                index.isNaN(NaN)
                expect(index.isNaN(undefined)).not.be.ok

                // Null
                expect(index.isNull(null)).be.ok;

                // Undefined
                expect(index.isUndefined(undefined)).be.ok;

            });

        });
    };
});
