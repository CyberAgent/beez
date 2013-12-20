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
            "index" : "./beez-utils/index",
            "browser" : "./beez-utils/browser",
            "timer" : "./beez-utils/timer",
            "uid" : "./beez-utils/uid",
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
                    "app": "http://0.0.0.0:1109/app",
                    "api": "http://0.0.0.0:1109/api",
                    "base": "http://0.0.0.0:1109",
                    "stat": "http://0.0.0.0:1109/stat"
                },
                "logging": {
                    "level": "DEBUG",
                    "separator": " "
                },
                "router": {
/**
                    "test/:id": {
                        "route": "test/:id",
                        "name": "test",
                        "require": "test/index",
                        "xpath": "/@/test"
                    },
**/
                    "*default": {
                        "route": "*default",
                        "name": "dummy",
                        "require": "../spec/dummy",
                        "xpath": "/@/dummy"
                    }
                }
            }
        }
    });

    // Require libraries
    require(['require', 'chai', 'mocha', 'zepto'], function(require,chai,mocha,$){
        // Chai
        global.assert = chai.assert;
        global.expect = chai.expect;
        //global.should = chai.should();

        // Mocha
        global.mocha.setup('bdd');
        var spec = global.spec;

        spec.rerun = function rerun() {
            if (!spec.TestCaseName) {
                return;
            }
            //var suite = require(['spec/' + el.getAttribute("data-name")]);
            // Require base tests before starting
            require(['spec/' + spec.TestCaseName], function(suite){
                // Start runner
                global.mocha.suite.suites = []; // clear
                suite();
                var runner = global.mocha.run();
                runner.globals([
                        '_zid' // Backbone.history
                ]);
            });
        };

    });
})(this);
