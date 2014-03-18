/**
 * @name view.js<spec>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview TestCase: s/beez-mvcr/view
 */

define(['view'], function(view){
    var View = view.View;
    var ViewManager = view.ViewManager;

    //var manager = view.manager;
    var manager = new ViewManager('vidx');

    var TestView = View.extend(
        'test.view.TestView',
        {
            vidx: '@',
            id: '__test_view_testview_render__',
            order: 0,
            initialize: function (obj) {
                if (obj) {
                    this.foo = obj.foo || false;
                }
            },
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test_view_testview_render__">Hello!!</div>');
                $('#__temp__').html(this.$el);
                return this;
            },
            events: {
                'dblclick': 'onDblClick'
            },
            afterOnce: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.afterOnce = true;
                    done(true);
                }, 100);
            },
            after: function () {
                this.test.show.after = true;
            },
            before: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.before = true;
                    done(true);
                }, 100);
            },
            beforeOnce: function (done) {
                var self = this;
                setTimeout(function () {
                    self.test.show.beforeOnce = true;
                    done(true);
                }, 100);
            },
            onDblClick: function() {
                this.test.events.dblclick = true;
            },
            conceal: function(done) {
                var self = this;
                setTimeout(function () {
                    done(true);
                }, 100);
            },
            test: {
                events: {
                    'dblclick': false
                },
                show: {
                    after: false,
                    afterOnce: false,
                    before: false,
                    beforeOnce: false
                }
            }
        }
    );
    var TestView1 = View.extend(
        'test.view.TestView1',
        {
            vidx: 'testVidx1',
            id: '__test_view_testview_render1__',
            order: 1,
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test1__">Hello!! - 1 </div>');
                $('#__temp__').html(this.$el);
                return this;
            }
        }
    );
    var TestView2 = View.extend(
        'test.view.TestView2',
        {
            vidx: 'testVidx2',
            id: '__test_view_testview_render2__',
            order: 2,
            dummy: function () {
                return "dummy";
            },
            render: function render() {
                this.$el.html('<div id="__test2__">Hello!! - 2 </div>');
                $('#__temp__').html(this.$el);
                return this;
            }
        }
    );

    var testView, testView1, testView2;

    return function () {
        describe('View', function () {

            it('constructor', function () {
                testView = new TestView(manager, {'foo': true});
                expect(testView.constructor.name).eq('test_view_TestView');
            });

            it('member variable', function () {
                expect(testView.$).be.ok;
                expect(testView.$el).be.ok;
                //expect(testView.cid).eq('view1');
                expect(testView.order).eq(0);

                expect(testView.foo).be.ok
                expect(testView.visible).be.ok;
                expect(testView.manager).be.ok;
                expect(testView.vidx).eq('@');
            });

            it('before/beforeOnce/after/afterOnce', function () {
                testView.after();
                expect(testView.test.show.after).be.ok;

                _.each(['afterOnce', 'before', 'beforeOnce'], function(method) {
                    testView[method](function(res) {
                        expect(res).be.ok;
                        expect(testView.test.show[method]).be.ok;
                    });
                });

                expect(testView.state.isBeforeOnce).not.be.ok;
                expect(testView.state.isAfterOnce).not.be.ok;
            });

            it('events', function() {
                testView.$el.trigger('dblclick');
                expect(testView.test.events.dblclick).be.ok;
            });

            it('show()/hide()', function(done) {
                testView
                    .async()
                    .show()
                    .then(function(view, next) {
                        expect($("#__test_view_testview_render__").length).eq(1);
                        expect(view.isRendered()).eq(true);
                        expect(view.state.isBeforeOnce).be.ok;
                        expect(view.state.isAfterOnce).be.ok;

                        view
                            .async()
                            .hide()
                            .then(function(view, next) {
                                expect($("#__test_view_testview_render__").length).eq(0);
                                expect(view.isRendered()).eq(false);
                                done();
                            })
                            .error(function(err, res) {
                                throw new Error("hide error.");
                                done();
                            })
                            .end()
                        ;
                    })
                    .error(function(err, res) {
                        throw new Error("show error.", err);
                        done();
                    })
                    .end()
                ;

            });

            it('show()/hide()-sequense', function (done) {
                manager.root(TestView);
                var hideSequence = [];
                var showSequence = [];
                var sequence = ['parent_a', 'child_a', 'child_b', 'grand_child_a', 'grand_child_b'];
                var ParentA = View.extend('test.view.ParentA', { vidx: 'parent_a',
                        after: function () {
                            this.getParent().$el.append(this.$el);
                            showSequence.push(this.vidx);
                        },
                        conceal: function () {
                            hideSequence.push(this.vidx);
                        }
                    }
                );
                var ChildA = View.extend('test.view.ChildA', { vidx: 'child_a', order: 1,
                        after: function () {
                            this.getParent().$el.append(this.$el);
                            showSequence.push(this.vidx);
                        },
                        conceal: function () {
                            hideSequence.push(this.vidx);
                        }
                    }
                );
                var ChildB = View.extend('test.view.ChildB', { vidx: 'child_b', order: 2,
                        after: function () {
                            this.getParent().$el.append(this.$el);
                            showSequence.push(this.vidx);
                        },
                        conceal: function () {
                            hideSequence.push(this.vidx);
                        }
                    }
                );
                var GrandChildA = View.extend('test.view.GrandChildA', { vidx: 'grand_child_a', order: 1,
                        after: function () {
                            this.getParent().$el.append(this.$el);
                            showSequence.push(this.vidx);
                        },
                        conceal: function () {
                            hideSequence.push(this.vidx);
                        }
                    }
                );
                var GrandChildB = View.extend('test.view.GrandChildB', { vidx: 'grand_child_b', order: 2,
                        after: function () {
                            this.getParent().$el.append(this.$el);
                            showSequence.push(this.vidx);
                        },
                        conceal: function () {
                            hideSequence.push(this.vidx);
                        }
                    }
                );

                var parent_a = manager.create('/@', ParentA);
                var child_a = manager.create('/@/parent_a', ChildA);
                var child_b = manager.create('/@/parent_a', ChildB);
                var g_child_a = manager.create('/@/parent_a/child_b', GrandChildA);
                var g_child_b = manager.create('/@/parent_a/child_b', GrandChildB);

                manager.get('/@').async().show().then(function () {

                    expect(showSequence).to.deep.equal(sequence);
                    expect(parent_a.isRendered()).eq(true);
                    expect(child_a.isRendered()).eq(true);
                    expect(child_b.isRendered()).eq(true);
                    expect(g_child_a.isRendered()).eq(true);
                    expect(g_child_b.isRendered()).eq(true);

                    sequence.reverse();

                    manager.get('/@').async().hide().then(function () {

                        expect(hideSequence).to.deep.equal(sequence);
                        expect(parent_a.isRendered()).eq(false);
                        expect(child_a.isRendered()).eq(false);
                        expect(child_b.isRendered()).eq(false);
                        expect(g_child_a.isRendered()).eq(false);
                        expect(g_child_b.isRendered()).eq(false);

                        manager.remove('/@');
                        done();
                    }).end();

                }).end();
            });

            it('#show()/hide())-filter', function(done) {

                var ShowView = View.extend(
                    'show.view',
                    {
                        vidx: 'show',
                        render: function () {
                            this.getParent().$el.append(this.$el); 
                        }
                    }
                );
                var HideView = View.extend(
                    'hide.view',
                    {
                        vidx: 'hide',
                        render: function () {
                            this.getParent().$el.append(this.$el);
                        }
                    }
                );
                var IgnoreView = View.extend(
                    'ignore.view',
                    {
                        vidx: 'ignore',
                        render: function () {
                            this.getParent().$el.append(this.$el); 
                        }
                    }
                );
                manager.root(TestView);
                var ignoreView = manager.create('/@', IgnoreView);
                var showView = manager.create('/@', ShowView);
                var hideView = manager.create('/@', HideView);

                manager.get('/@').async().show({
                    filter: function (view) {
                        return view.vidx === 'show' || view.vidx === 'hide';
                    }
                }).then(function () {
                    expect(showView.isRendered()).eq(true);
                    expect(hideView.isRendered()).eq(true);
                    expect(ignoreView.isRendered()).eq(false);
                    manager.get('/@').async().hide({
                        filter: function (view) {
                            return view.vidx === 'hide';
                        }
                    }).then(function () {
                        expect(showView.isRendered()).eq(true);
                        expect(hideView.isRendered()).eq(false);
                        manager.remove('/@');
                        done();
                    })
                    .end();
                })
                .end();

            });

            it('setVisible', function() {
                manager.root(TestView);
                testView1 = manager.create('/@', TestView1, {'test': true});
                testView.setVisible(false);
                expect(testView.visible).eq(false);
            });

        });

        describe('ViewManager', function () {
            it('trace', function () {
                var keys = _.keys(manager.trace());
                expect(keys[0]).eq("/@/testVidx1");
                expect(keys[1]).eq("/@");
                expect(manager.objs["@"].vidx).eq("@");
                manager.get('/@');
            });
            it('Anti-pattern - If manually, in a member variable of View, you have set the View.', function () {
                var ParentA = View.extend('test.view.ParentA', { vidx: 'parent_a' });
                var ParentB = View.extend('test.view.ParentB', { vidx: 'parent_b' });
                var ChildA = View.extend('test.view.ChildA', { vidx: 'child_a' });
                var ChildB = View.extend('test.view.ChildB', { vidx: 'child_b' });

                var parent_a = manager.create('/@', ParentA);
                var parent_b = manager.create('/@', ParentB);
                var child_a = manager.create('/@/parent_a', ChildA);
                var child_b = manager.create('/@/parent_b', ChildB);


                parent_a.child_b = child_b; // Set manually (Anti-pattern)

                var trace = manager.trace();

                expect(trace['/@/parent_a']).be.ok;
                expect(trace['/@/parent_b']).be.ok;
                expect(trace['/@/parent_a/child_a']).be.ok;
                expect(trace['/@/parent_b/child_b']).be.ok;
                expect((!!trace['/@/parent_a/child_b'])).not.be.ok;
                expect(parent_a.child_b).be.ok;

                manager.remove('/@/parent_a');

                trace = manager.trace();

                expect((!!trace['/@/parent_a'])).not.be.ok;
                expect(trace['/@/parent_b']).be.ok;
                expect((!!trace['/@/parent_a/child_a'])).not.be.ok;
                expect(trace['/@/parent_b/child_b']).be.ok;
                expect((!!trace['/@/parent_a/child_b'])).not.be.ok;
                expect((!!parent_a.child_a)).not.be.ok;
                expect((!!parent_a.child_b)).be.ok;

            });
            it('dispose', function () {
                manager.dispose();
            });
        });
    };
});
