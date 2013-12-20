/**
 * @name index.js<spec/index>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/index
 */

define(['beez.mvcr', 'beez.core'], function(mvcr, beez){

    beez.manager.setup();

    return function() {
        describe('beez.manager', function(){
            it('c', function() {
                expect(beez.manager.c.constructor.name).eq("beez_mvcr_ControllerManager");
            });
            it('controller', function() {
                expect(beez.manager.controller.constructor.name).eq("beez_mvcr_ControllerManager");
            });
            it('css', function() {
                expect(beez.manager.css.constructor.name).eq("beez_mvcr_CSSManager");
            });
            it('image', function() {
                expect(beez.manager.image.constructor.name).eq("beez_mvcr_ImageManager");
            });
            it('m', function() {
                expect(beez.manager.m.constructor.name).eq("beez_mvcr_ModelManager");
            });
            it('model', function() {
                expect(beez.manager.model.constructor.name).eq("beez_mvcr_ModelManager");
            });
            it('r', function() {
                expect(beez.manager.r.constructor.name).eq("beez_mvcr_RouterManager");
            });
            it('router', function() {
                expect(beez.manager.router.constructor.name).eq("beez_mvcr_RouterManager");
            });
            it('v', function() {
                expect(beez.manager.v.constructor.name).eq("beez_mvcr_ViewManager");
            });
            it('view', function() {
                expect(beez.manager.view.constructor.name).eq("beez_mvcr_ViewManager");
            });
            it('setuped', function() {
                expect(beez.manager.setuped).be.ok;
            });
        });

        describe('mvcr', function(){
            it('CSSManagerAsync', function() {
                expect(mvcr.CSSManagerAsync).be.ok;
            });
            it('ControllerManager', function() {
                expect(mvcr.ControllerManager).be.ok;
            });
            it('ControllerManagerAsync', function() {
                expect(mvcr.ControllerManagerAsync).be.ok;
            });
            it('ImageManagerAsync', function() {
                expect(mvcr.ImageManagerAsync).be.ok;
            });
            it('ModelManagerAsync', function() {
                expect(mvcr.ModelManagerAsync).be.ok;
            });
            it('Router', function() {
                expect(mvcr.Router).be.ok;
            });
            it('ViewAsync', function() {
                expect(mvcr.ViewAsync).be.ok;
            });
            it('ViewManagerAsync', function() {
                expect(mvcr.ViewManagerAsync).be.ok;
            });
            it('manager', function() {
                expect(mvcr.manager).be.ok;
            });
            it('Collection', function() {
                expect(mvcr.Collection).be.ok;
            });
            it('Controller', function() {
                expect(mvcr.Controller).be.ok;
            });
            it('Model', function() {
                expect(mvcr.Model).be.ok;
            });
            it('View', function() {
                expect(mvcr.View).be.ok;
            });
            it('CSSManager', function() {
                expect(mvcr.CSSManager).be.ok;
            });
            it('ImageManager', function() {
                expect(mvcr.ImageManager).be.ok;
            });
            it('ModelManager', function() {
                expect(mvcr.ModelManager).be.ok;
            });
            it('Modic', function() {
                expect(mvcr.Modic).be.ok;
            });
            it('RouterManager', function() {
                expect(mvcr.RouterManager).be.ok;
            });
            it('ViewManager', function() {
                expect(mvcr.ViewManager).be.ok;
            });
            it('ManagerBase', function() {
                expect(mvcr.ManagerBase).be.ok;
            });
            it('Base', function() {
                expect(mvcr.Base).be.ok;
            });
        });
    };
});
