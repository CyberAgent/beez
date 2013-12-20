(function () {

    return {
        "app": {
            "stat": {
                "compress": true,
                "port": 1109,
                "header": {
                    "Access-Control-Allow-Origin" : "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "Content-Type, X-HTTP-Method-Override"
                }
            },
            "mock": {
                "use": true,
                "compress": true,
                "port": 1121,
                "header": {
                    "Access-Control-Allow-Origin" : "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "Content-Type, X-HTTP-Method-Override"
                },
                "include": {
                    "path": "./mockdata",
                    "from": null
                }
            },
            "operation": [
                { "target": "build", "comment": "grunt build" },
                { "target": "deploy", "comment": "grunt deploy" },
                { "target": "default", "comment": "grunt default" },
                { "target": "jshint", "comment": "grunt jshint" },
                { "target": "clean", "comment": "grunt clean" },
                { "target": "docs", "comment": "grunt docs" }
            ]
        },
        "stats": {
        },
        "bootstrap": {
            "html": [ "*/index/index.html.hbs" ],
            "datamain": [ "*/index/require.beez.js.hbs", "*/tutorial/require.beez.js.hbs" ]
        },
        "stylus": {
            "options": {
                "encode": "utf-8",
                "compress": false,
                "firebug": false,
                "linenos": false,
                "nib": true,
                "url": {},
                "fn": {}
            }
        },
        "image": {
            "options": {
                "baseRatio": 2,
                "ratios": [ 1, 1.5, 2, 3 ],
                "extnames": [ ".png" ],
                "include": [],
                "exclude": [],
                "separator": "-"
            }
        },
        "sprite": {
            "options": {
                "ratios": [ 1, 1.3, 1.5, 2 ],
                "extnames": [ ".png", ".jpg" ],
                "heads": [ "sprite", "_sprite" ],
                "separator": "-"
            }
        },
        "deploy": {
            "optipng": true,
            "jpegoptim": true,
            "include": [ "dist/*/index.js", "dist/index/require.beez.*.js", "*.html", "*.css", "*.png", "*.jpg", "*.gif", "*.ttf", "*.eot", "*.woff" ],
            "exclude": [ "_*.css", "_*.png", "_*.jpg", "_*.gif", "_*.ttf", "_*.eot", "_*.woff" ]
        },
        "ignore": {
            "include": [],
            "exclude": []
        }
    }
}());
