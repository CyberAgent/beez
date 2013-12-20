/**
 * @name todo.js<todos/collection>
 * @author <author>
 * @overview model of todo
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var logger = beez.getLogger('model.todo');

    var Backbone = beez.vendor.Backbone;

    require('backbone.localStorage'); // Load local storage.

    var mv = beez.manager.v;
    var mm = beez.manager.m;

    var TodoModel = require('todos/model/todo');

    var Store = Backbone.LocalStorage;

    var TodoCollection = beez.Collection.extend(
        'todos.collection.TodoCollection',
        {
            midx: 'todos',

            model: TodoModel,

            localStorage: new Store('todos-beez'),

            completed: function () {
                return this.filter(function (todo) {
                    return todo.get('completed');
                });
            },

            remaining: function () {
                return this.without.apply(this, this.completed());
            },

            nextOrder: function () {
                if (!this.length) {
                    return 1;
                }
                return this.last().get('order') + 1;
            },

            comparator: function (todo) {
                return todo.get('order');
            }

            //

        });

    return TodoCollection;
});
