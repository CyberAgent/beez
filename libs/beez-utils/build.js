({
    appDir: "./s",
    baseUrl: ".",
    dir: "./dist",
    optimize: 'none',

    paths: {
        "backbone"  : "../../../vendor/backbone",
        "underscore": "../../../vendor/underscore",
        "zepto"     : "../../../vendor/zepto",
        "handlebars": "../../../vendor/handlebars.runtime",
        "beez.core" : "../../beez-core/release/beez.core",
        "beez.ua" : "../../beez-ua/release/beez.ua",
        "beez.utils": "./beez-utils/index"
    },

    shim: {
        backbone: {
            deps: ["underscore", "zepto"],
            exports: "Backbone"
        },
        zepto: {
            exports: "$"
        },
        underscore: {
            exports: "_"
        },
        handlebars: {
            exports: "Handlebars"
        }
    },

    modules: [
        {
            name: "beez.utils",
            exclude: [
                "backbone",
                "underscore",
                "zepto",
                "handlebars",
                "beez.core",
                "beez.ua"
            ]
        }
    ]
})
