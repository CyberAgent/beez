({
    appDir: "./s",
    baseUrl: ".",
    dir: "./dist",
    optimize: "none",

    paths: {
        "underscore": "../../../vendor/underscore",
        "zepto"     : "../../../vendor/zepto",
        "backbone"  : "../../../vendor/backbone",
        "handlebars": "../../../vendor/handlebars.runtime",
        "beez.core": "beez-core/index"
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
        "beez.core": {
            deps: ["underscore", "zepto"]
        }
    },

    modules: [
        {
            name: "beez.core",
            include: [],
            exclude: ["handlebars", "underscore", "backbone","zepto"]

        }
    ]
})
