(function(global) {
    var require = global.require;

    // Configure RequireJS
    require.config({
        "baseUrl": "../s",
        "urlArgs": "v="+(new Date()).getTime(),
        "paths": {
            "mocha": "../node_modules/mocha/mocha",
            "chai": "../node_modules/chai/chai",
            "backbone"  : "../../../vendor/backbone",
            "backbone.localStorage": "../spec/vendor/backbone.localStorage",
            "underscore": "../../../vendor/underscore",
            "zepto"     : "../../../vendor/zepto",
            "handlebars": "../../../vendor/handlebars.runtime",
            "beez.core" : "../../beez-core/release/beez.core",
            "beez.ua" : "../../beez-ua/release/beez.ua",
            "beez.utils" : "../../beez-utils/release/beez.utils",
            "beez.i18n" : "../../beez-i18n/release/beez.i18n",
            "beez.mvcr" : "./beez-mvcr/index",
            "base" : "./beez-mvcr/base",
            "controller" : "./beez-mvcr/controller",
            "cssmanager" : "./beez-mvcr/cssmanager",
            "imagemanager" : "./beez-mvcr/imagemanager",
            "view" : "./beez-mvcr/view",
            "model" : "./beez-mvcr/model",
            "modic" : "./beez-mvcr/modic",
            "router" : "./beez-mvcr/router",
            "spec": '../spec'
        },
        "shim": {
            "backbone": {
                "deps": [
                    "underscore",
                    "zepto"
                ],
                "exports": "Backbone"
            },
            "zepto": {
                "exports": "$"
            },
            "underscore": {
                "exports": "_"
            },
            "handlebars": {
                "exports": "Handlebars"
            }
        },
        "config": {
            "beez.core": {
                "mode": "local",
                "url": {
                    "app": "http://0.0.0.0:1109/",
                    "api": "http://0.0.0.0:1109/p",
                    "base": "http://0.0.0.0:1109",
                    "stat": "http://0.0.0.0:1109/stat"
                },
                "logging": {
                    "level": "TRACE",
                    "separator": " "
                },
                "router": {
                    "test": {
                        "route": "test(/:name)(/:desc)",
                        "name": "test",
                        "require": "../spec/test",
                        "xpath": "/@/test",
                        //"async": true
                    },
/**
                    "test/:id": {
                        "route": "test/:id",
                        "name": "test",
                        "require": "test/index",
                        "xpath": "/@/test"
                    },
                    "*default": {
                        "route": "*default",
                        "name": "dummy",
                        "require": "../spec/dummy",
                        "xpath": "/@/dummy",
                        "async": true
                    }
**/
                },
                "ajax": {
                    "emulateHTTP": true
                }
            }
        }
    });

    // Require libraries
    require(['require', 'chai', 'mocha', 'zepto'], function(require,chai,mocha,$){
        // Chai
        global.assert = chai.assert;
        //global.should = chai.should();
        global.expect = chai.expect;

        // Mocha
        global.mocha.setup('bdd');
        var spec = global.spec;

        spec.rerun = function rerun() {
            if (!spec.TestCaseName) {
                return;
            }
            var names = [];
            if (spec.TestCaseName !== 'all') {
                names.push('spec/' + spec.TestCaseName);
            } else {
                $("#nav a").each(function(i, a) {
                    var name = $(a).data("name");
                    if (name === 'all') {
                        return;
                    }
                    names.push('spec/' + name);
                });
            }
            console.log('Test Case:', names);
            //var suite = require(['spec/' + el.getAttribute("data-name")]);
            // Require base tests before starting
            require(names, function(){
                // Start runner
                global.mocha.suite.suites = []; // clear
                _.each(arguments, function (suite, idx) {
                    suite();
                });
                var runner = global.mocha.run();
                runner.globals([
                    '_zid' // Backbone.history
                ]);
            });
        };

    });
})(this);
