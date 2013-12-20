/**
 * @name todo.js<todos/model>
 * @author <author>
 * @overview model of todo
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var logger = beez.getLogger('model.todo');

    var mv = beez.manager.v;
    var mm = beez.manager.m;

    var TodoModel = beez.Model.extend(
        'todos.model.TodoModel',
        {
            midx: 'todo',
            defaults: {
                title: '',
                completed: false
            },

            toggle: function toggle() {
                this.save({
                    completed: !this.get('completed')
                });
            }

            //

        }
    );

    return TodoModel;
});
