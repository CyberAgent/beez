/**
 * @name header.js<todos/view>
 * @author <author>
 * @overview view of todos/header
 */

define(function (rquire, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;

    var mm = beez.manager.model;

    var Todo = require('todos/model/todo');
    var template = require('todos/hbs/header.hbsc');
    var ENTER_KEY = 13; // browser key-board

    var HeaderView = beez.View.extend(
        'todos.view.HeaderView',
        {
            tagName: 'header',
            id: 'header',
            vidx: 'header',

            events: {
                'keypress #new-todo': 'createOnEnter'
            },

            // Generate the attributes for a new Todo item.
            newAttributes: function () {
                return {
                    title: this.$input.val().trim(),
                    order: mm.get('/@/todos').nextOrder(),
                    completed: false
                };
            },

            createOnEnter: function (e) {
                if (e.which !== ENTER_KEY || !this.$input.val().trim()) {
                    return;
                }

                mm.get('/@/todos').create(this.newAttributes());
                this.$input.val('');
            },

            render: function render() {
                var self = this;

                self.$el.html(template());
                self.$input = self.$('#new-todo');
                var p = self.getParent();
                p.$el.append(self.$el);
            }

            //

        }
    );

    return HeaderView;
});
