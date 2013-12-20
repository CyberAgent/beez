/**
 * @name index.js<todos/view>
 * @author <author>
 * @overview view to todos/todo
 */

(function (global) {
    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez');
        var mv = beez.manager.view;
        var mc = beez.manager.controller;

        require('todos/hbs/todo.hbsc');
        var template = beez.getTemplate('todo');

        var TodoView = beez.View.extend(
            'todos.view.TodoView',
            {
                vidx: 'todo',
                tagName:  'li', //... is a list tag.
                events: {
                    'click .toggle':	'toggleCompleted',
                    'dblclick label':	'edit',
                    'click .destroy':	'clear',
                    'keypress .edit':	'updateOnEnter',
                    'blur .edit':		'close'
                },

                toggleVisible: function () {
                    this.$el.toggleClass('hidden',  this.isHidden());
                },

                isHidden: function () {
                    var isCompleted = this.model.get('completed');
                    var state = mc.get('/@/todos').state;

                    if (isCompleted && state === 'todos/completed') {
                        return false;
                    }
                    if (!isCompleted && state === 'todos/active') {
                        return false;
                    }
                    if (state === 'todos') {
                        return false;
                    }
                    return true;
                },

                toggleCompleted: function () {
                    this.model.toggle();
                },

                edit: function () {
                    this.$el.addClass('editing');
                    this.$input.focus();
                },

                close: function () {
                    var value = this.$input.val().trim();

                    if (value) {
                        this.model.save({ title: value });
                    } else {
                        this.clear();
                    }

                    this.$el.removeClass('editing');
                },

                updateOnEnter: function (e) {
                    var ENTER_KEY = 13;
                    if (e.which === ENTER_KEY) {
                        this.close();
                    }
                },

                clear: function () {
                    this.model.destroy();
                },
                dispose: function dispose() {
                    delete this.model;
                },

                beforeOnce: function beforeOnce() {
                    this.listenTo(this.model, 'change', this.change);
                    this.listenTo(this.model, 'destroy', this.remove);
                    this.listenTo(this.model, 'visible', this.toggleVisible);
                },

                render: function () {
                    this.$el.html(template(this.model.toJSON()));
                    this.$el.toggleClass('completed', this.model.get('completed'));
                    var p = this.getParent();
                    p.$('#todo-list').append(this.$el);
                    this.toggleVisible();
                    this.$input = this.$('.edit');
                    return this;
                },

                change: function () {
                    this.$el.html(template(this.model.toJSON()));
                    this.$el.toggleClass('completed', this.model.get('completed'));

                    this.toggleVisible();
                    this.$input = this.$('.edit');

                    return this;
                }

                //

            }
        );

        return TodoView;

    });
})(this);
