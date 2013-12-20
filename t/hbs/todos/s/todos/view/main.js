/**
 * @name main.js<todos/view>
 * @author <author>
 * @overview view of todos/main
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var $ = beez.vendor.$;

    var logger = beez.getLogger('todos.view.main');

    var mm = beez.manager.model;
    var mv = beez.manager.view;

    var template = require('todos/hbs/main.hbsc');

    var TodoCollection = require('todos/collection/todos');

    mm.createCollection('/@', TodoCollection);
    var Todo = require('todos/model/todo');

    var TodoView = require('todos/view/todo');

    //beez.Bucks.DEBUG = true;

    var MainView = beez.View.extend(
        'todos.view.MainView',
        {
            tagName: 'section',
            id: 'main',
            vidx: 'main',
            order: 1,
            events: {
                'click #toggle-all': 'toggleAllComplete'
            },
            attributes: {
                //style: 'display: none'
            },
            initialize: function initialize() {
                this.$el.html(template());
            },

            addOne: function (todo) {
                var cv = mv.create('/@/main', [TodoView], [{model: todo}]);
                cv[0].async().show().end();
            },

            addAll: function () {
                mv.remove("/@/main/todo"); // view full reset
                this.$('#todo-list').html('');
                mm.get('/@/todos').each(this.addOne, this);
            },

            filterOne: function (todo) {
                todo.trigger('visible');
            },

            filterAll: function () {
                this.todos.each(this.filterOne, this);
            },

            before: function () {
                this.todos = mm.get('/@/todos');
                this.allCheckbox = this.$('#toggle-all')[0];
                this.$input = this.$('#new-todo');

                this.listenTo(this.todos, 'add', this.addOne);
                this.listenTo(this.todos, 'change:completed', this.filterOne);
                this.listenTo(this.todos, 'filter', this.filterAll);
                this.listenTo(this.todos, 'change', this.render);
                //this.listenTo(this.todos, 'all', this.render);
                this.listenTo(this.todos, 'reset', this.addAll);

                this.todos.fetch(); // collection update!!
            },

            render: function render() {
                var completed = this.todos.completed().length;
                var remaining = this.todos.remaining().length;
                logger.debug("completed:", completed, "remaining:", remaining);

                if (0 < this.todos.length) {
                    this.$el.show();
                } else {
                    this.$el.hide();
                }
                this.getParent().$el.append(this.$el);
                this.allCheckbox.checked = !remaining; // default #toggle-all:checked
            },

            toggleAllComplete: function () {
                var completed = this.allCheckbox.checked;

                this.todos.each(function (todo) {
                    todo.save({
                        'completed': completed
                    });
                });
            }

            //

        }
    );

    return MainView;
});
