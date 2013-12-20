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
        "zepto"     : "../vendor/zepto",
        "backbone"  : "../vendor/backbone",
        "handlebars": "../vendor/handlebars.runtime",
        "beez"      : "../vendor/beez"
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
                "beez"
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
                "beez"
            ]
        }
    ]
})
