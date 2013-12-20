({
    appDir: "./s",
    baseUrl: "./",
    dir: "./dist",
    optimize: "none",
    //optimize: "uglify2",
    //optimizeCss: "standard", // use beez#beez-stylus2css
    logLevel: 1,
    waitSeconds: 7,

    //http://lisperator.net/uglifyjs/codegen
    //http://lisperator.net/uglifyjs/compress
    uglify2: {
        compress: {
            global_defs: {
                DEBUG: false
            }
        },
        warnings: false
    },
    preserveLicenseComments: false,

    paths: {
        "underscore": "../vendor/underscore",
        "zepto": "../vendor/zepto",
        "backbone": "../vendor/backbone",
        "beez": "../vendor/beez",
        "handlebars": "../vendor/handlebars.runtime",
        "backbone.localStorage": "../vendor/backbone.localStorage"
    },
    modules: [
        {
            name: "core/index",
            include: [],
            exclude: [
                "underscore",
                "zepto",
                "backbone",
                "handlebars",
                "beez",
                "backbone.localStorage"
            ]
        },
        {
            name: "index/index",
            include: [],
            exclude: [
                "underscore",
                "zepto",
                "backbone",
                "handlebars",
                "beez",
                "backbone.localStorage"
            ]
        },
        {
            name: "todos/index",
            include: [],
            exclude: [
                "underscore",
                "zepto",
                "backbone",
                "handlebars",
                "beez",
                "backbone.localStorage"
            ]
        }
    ]
})
