({
    appDir: "./s",
    baseUrl: ".",
    dir: "./dist",
    optimize: "none",
    //optimize: "uglify2",

    paths: {
        "backbone"  : "../../../vendor/backbone",
        "handlebars": "../../../vendor/handlebars.runtime",
        "underscore": "../../../vendor/underscore",
        "zepto"     : "../../../vendor/zepto",
        "beez.core" : "../../beez-core/release/beez.core",
        "beez.ua": "../../beez-ua/release/beez.ua",
        "beez.utils": "../../beez-utils/release/beez.utils",
        "beez.i18n" : "./beez-i18n/index"
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
            name: "beez.i18n",
            exclude: [
                "backbone",
                "underscore",
                "zepto",
                "handlebars",
                "beez.core",
                "beez.ua",
                "beez.utils"
            ]
        }
    ]
})
