/**
 * @name index.js<todos>
 * @author <author>
 * @overview Todos Controller class
 */

define(function (require, exports, module) {
    'use strict';

    var beez = require('beez');
    var logger = beez.getLogger('todos.index');

    var mv = beez.manager.v;
    var mm = beez.manager.m;
    var mcss = beez.manager.css;

    var __TodosController__ = {

        // auto-load
        css: [
            'todos/styl/main.css',
            'todos/styl/header.css',
            'todos/styl/footer.css'
        ],

        i18n: function i18n() {
            return {
                en: require('todos/i18n/en'),
                ja: require('todos/i18n/ja')
            };
        },

        initialize: function initialize() {
            // prepare view instance
            var HeaderView = require('todos/view/header');
            mv.create('/@', HeaderView);

            var MainView = require('todos/view/main');
            mv.create('/@', MainView);

            var FooterView = require('todos/view/footer');
            mv.create('/@', FooterView);
        },

        todos: function todos(state) {
            if (state === 'todos/active') {
                logger.trace('start#todos/active');
            } else if (state === 'todos/completed') {
                logger.trace('start#todos/active');
            } else {
                logger.trace('start#todos');
            }
            this.state = state || 'todos';
            var todos = mm.get('/@/todos');
            todos.trigger('filter'); // view/main filterAll

            mv.get('/@').async().hide().then(function () {
                mv.get('/@').async().show().end();
            }).end();
        }

        //

    };

    var TodosController = beez.Controller.extend(
        'todos.TodosController',
        __TodosController__
    );

    return TodosController;
});
