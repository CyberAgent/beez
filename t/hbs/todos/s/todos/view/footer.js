/**
 * @name footer.js<todos/view>
 * @author <author>
 * @overview view of footer
 */

define(function (rquire, exports, module)  {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;

    var template = require('todos/hbs/footer.hbsc');

    var mc = beez.manager.controller;
    var mv = beez.manager.view;
    var mm = beez.manager.model;

    var FooterView = beez.View.extend(
        'todos.view.FooterView',
        {
            tagName: 'footer',
            id: 'footer',
            vidx: 'footer',
            order: 2,
            attributes: {
                //style: 'display: none;'
            },
            events: {
                'click #clear-completed': 'clearCompleted'
            },

            before: function () {
                this.todos = mm.get('/@/todos');
                this.listenTo(this.todos, 'all', this.render);
            },

            render: function render() {
                var completed = this.todos.completed().length;
                var remaining = this.todos.remaining().length;

                this.$el.html(template({
                    completed: completed,
                    remaining: remaining
                }));
                if (0 < this.todos.length) {
                    this.$el.show();
                    var state = mc.get('/@/todos').state;
                    var $el = this.$('#filters li a').removeClass('selected');
                    $el.filter('[href="#' + (state || 'todos') + '"]').addClass('selected');
                } else {
                    this.$el.hide();
                }
                this.getParent().$el.append(this.$el);
            },

            clearCompleted: function () {
                beez.vendor._.invoke(this.todos.completed(), 'destroy');
                return false;
            }

            //

        }
    );

    return FooterView;
});
