({
    appDir: "./s",
    baseUrl: ".",
    dir: "./dist",
    optimize: "none",

    paths: {
        "backbone"  : "../../../vendor/backbone",
        "underscore": "../../../vendor/underscore",
        "zepto"     : "../../../vendor/zepto",
        "handlebars": "../../../vendor/handlebars.runtime",
        "beez.core" : "../../beez-core/release/beez.core",
        "beez.ua": "../../beez-ua/release/beez.ua",
        "beez.utils": "../../beez-utils/release/beez.utils",
        "beez.i18n" : "../../beez-i18n/release/beez.i18n",
        "beez.mvcr" : "./beez-mvcr/index"
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
            name: "beez.mvcr",
            exclude: [
                "backbone",
                "underscore",
                "zepto",
                "handlebars",
                "beez.core",
                "beez.ua",
                "beez.utils",
                "beez.i18n"
            ]
        }
    ]
})
