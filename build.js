({
    appDir: "./s",
    baseUrl: ".",
    dir: "./dist",
    optimize: 'none',

    paths: {
        "backbone"  : "../vendor/backbone",
        "underscore": "../vendor/underscore",
        "zepto"     : "../vendor/zepto",
        "handlebars": "../vendor/handlebars.runtime",
        "beez.core" : "../libs/beez-core/release/beez.core",
        "beez.mvcr" : "../libs/beez-mvcr/release/beez.mvcr",
        "beez.ua"   : "../libs/beez-ua/release/beez.ua",
        "beez.utils": "../libs/beez-utils/release/beez.utils",
        "beez.i18n" : "../libs/beez-i18n/release/beez.i18n",
        "beez"      : "./beez/index"
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
        },
        "beez.mvcr": {
            deps: ["beez.core", "beez.ua", "beez.utils", "beez.i18n"]
        },
        "beez.utils": {
            deps: ["beez.ua"]
        },
        "beez.i18n": {
            deps: ["beez.core", "beez.utils"]
        },
        "beez.ua": {
        }
    },

    modules: [
        {
            name: "beez",
            include: [
                "beez.core",
                "beez.mvcr",
                "beez.ua",
                "beez.utils",
                "beez.i18n"
            ],
            exclude: [
                "backbone",
                "underscore",
                "zepto",
                "handlebars"
            ]
        }
    ]
})
