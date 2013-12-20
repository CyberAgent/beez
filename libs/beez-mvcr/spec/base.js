/**
 * @name index.js<spec/index>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/index
 */

define(['beez.core', 'base'], function(core, base){
    var ManagerBase = base.ManagerBase;
    var Base = base.Base;

    var managerBase;

    return function () {
        // Test Object
        var Obj = core.extendThis('obj', Base.prototype, {bidx: '@'});
        var Obj1 = core.extendThis('obj1', Base.prototype, {bidx: 'obj1'});
        var Obj1a = core.extendThis('obj1a', Base.prototype, {bidx: 'obj1a'});
        var Obj1a1 = core.extendThis('obj1a1', Base.prototype, {bidx: 'obj1a1'});
        var Obj1b = core.extendThis('obj1b', Base.prototype, {bidx: 'obj1b'});
        var Obj1c = core.extendThis('obj1c', Base.prototype, {bidx: 'obj1c'});
        var Obj2 = core.extendThis('obj2', Base.prototype, {bidx: 'obj2'});
        var Obj3 = core.extendThis('obj3', Base.prototype, {bidx: 'obj3'});
        var ObjErr = core.extendThis('objerr', Base.prototype, {eidx: 'objerr'});

        var obj, obj1, obj1a, obj1a1, obj1b, obj1c, obj2, obj3, objerr;

        var inxProp = 'bidx';

        describe('ManagerBase', function () {
            it('constructor: function constructor(idxProp) {', function () {
                managerBase = new ManagerBase(inxProp);
                expect(managerBase._idxProp).equals(inxProp).be.ok;
                expect(managerBase.objs[inxProp]).equals('$').be.ok;

                obj = new Obj();
                obj1 = new Obj1();
                obj1a = new Obj1a();
                obj1a1 = new Obj1a1();
                obj1b = new Obj1b();
                obj1c = new Obj1c();
                obj2 = new Obj2();
                obj3 = new Obj3();
                objerr = new ObjErr();

                obj.manager = obj1.manager = obj1a.manager = obj1a1.manager = obj1b.manager =  obj1c.manager = obj2.manager = obj3.manager = objerr.manager = managerBase;

            });

            it('add() #1', function() {
                var manager = managerBase.add('/', obj);
                expect(manager.objs[obj[inxProp]].prefix).eq('/');
                expect(manager.objs[obj[inxProp]][inxProp]).eq(obj[inxProp]);
            });

            it('get()', function () {
                var manager = managerBase.add('/@', obj1);
                expect(manager.get('/@/obj1')).be.ok;
            });

            it('add() #2', function() {
                managerBase.add('/@/obj1', obj1a);
                managerBase.add('/@/obj1/obj1a', obj1a1);
                managerBase.add('/@/obj1', [obj1b, obj1c]);
                var _obj1 = managerBase.get('/@/obj1');
                expect(_obj1.obj1a).be.ok;
                expect(_obj1.obj1b).be.ok;
                expect(_obj1.obj1c).be.ok;
            });

            it('remove()', function() {
                var manager = managerBase.add('/@', obj2);
                manager.remove('/@/obj2');
                if (manager.get('/@/obj2')) {
                    expect(false).be.ok;
                }
                manager = managerBase.add('/@', obj2);
            });

            it('pathOf', function () {
                expect(managerBase.pathOf(obj1)).eq('/@/obj1');
            });
            it('getChildrenAll', function () {
                //console.log(managerBase.trace());

                var objs = managerBase.getChildrenAll(obj1);
                expect(objs[0][inxProp]).eq('obj1a1');
                expect(objs[1][inxProp]).eq('obj1a');
                expect(objs[2][inxProp]).eq('obj1b');
                expect(objs[3][inxProp]).eq('obj1c');
                expect(objs.length).eq(4);

                // root object children
                objs = managerBase.getChildrenAll(obj);
                expect(objs.length).eq(6);

                // all objects
                objs = managerBase.getChildrenAll(managerBase.objs);
                expect(objs.length).eq(7);

            });
            it('getChildrenAll - [anti-pattern]', function () {
                var obj2 = managerBase.get('/@/obj2');
                obj1.obj2 = obj2;


                var objs = managerBase.getChildrenAll(obj1);

                expect(objs[0][inxProp]).eq('obj1a1');
                expect(objs[1][inxProp]).eq('obj1a');
                expect(objs[2][inxProp]).eq('obj1b');
                expect(objs[3][inxProp]).eq('obj1c');
                expect(objs.length).eq(4);

                delete obj1.obj2; // reset
            });

            it('getChildren', function () {
                var objs = managerBase.getChildren(obj1);
                expect(objs[0][inxProp]).eq('obj1a');
                expect(objs[1][inxProp]).eq('obj1b');
                expect(objs[2][inxProp]).eq('obj1c');

                objs = managerBase.getChildren(obj);
                expect(objs.length).eq(2);

                objs = managerBase.getChildren(managerBase.objs);
                expect(objs.length).eq(1);
            });

            it('getIdx', function () {
                var _obj1 = managerBase.getIdx(obj1);
                expect(_obj1).eq('obj1').be.ok;
            });

            it('getParent', function () {
                var obj = managerBase.getParent(obj1a);
                expect(obj[inxProp]).eq('obj1');
            });

            it('isAddable', function () {
                expect(managerBase.isAddable(obj1)).be.ok;
                expect(managerBase.isAddable(objerr)).not.be.ok;
            });

            it('trace', function() {
                var trace = managerBase.trace();
                expect(_.keys(trace).length).eq(7);
            });

            it('dispose', function () {
                expect(managerBase.objs).be.ok;
                expect(managerBase._idxProp).be.ok;

                managerBase.dispose();

                expect(managerBase.objs).not.be.ok;
                expect(managerBase._idxProp).not.be.ok;
            });
        });
    };
});
