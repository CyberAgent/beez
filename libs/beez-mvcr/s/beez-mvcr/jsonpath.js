/**
 * @name base.js<beez-mvcr>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview base class of managed object
 */

(function (global) {

    define(function (require, exports, module) {
        'use strict';

        var beez = require('beez.core');
        var _ = beez.vendor._;

        // -------------------
        // JSONPath

        var cache = {}; // -- jsonpath implements


        /* JSONPath 0.8.0 - XPath for JSON
         *
         * Copyright (c) 2007 Stefan Goessner (goessner.net)
         * Licensed under the MIT (MIT-LICENSE.txt) licence.
         *
         * @license https://github.com/s3u/JSONPath
         */
        var jsonPath = function jsonPath(obj, expr, arg, testManaged) {
            var P = {
                resultType: arg && arg.resultType || "VALUE",
                flatten: arg && arg.flatten || false,
                wrap: (arg && arg.hasOwnProperty('wrap')) ? arg.wrap : true,

                normalize: function (expr) {
                    if (cache[expr]) {
                        return cache[expr];
                    }

                    var subx = [];
                    var ret =
                            expr.replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
                                return "[#" + (subx.push($1) - 1) + "]";
                            })
                            .replace(/'?\.'?|\['?/g, ";")
                            .replace(/;;;|;;/g, ";..;")
                            .replace(/;$|'?\]|'$/g, "")
                            .replace(/#([0-9]+)/g, function ($0, $1) {
                                return subx[$1];
                            });

                    cache[expr] = ret;
                    return ret;
                },
                asPath: function (path) {
                    var x = path.split(";"), p = "$";
                    for (var i = 1, n = x.length; i < n; i++) {
                        p += /^[0-9*]+$/.test(x[i]) ?
                            ("[" + x[i] + "]") : ("['" + x[i] + "']");
                    }
                    return p;
                },
                store: function (p, v) {
                    if (p) {
                        if (P.resultType === "PATH") {
                            P.result[P.result.length] = P.asPath(p);
                        } else {
                            if (_.isArray(v) && P.flatten) {
                                if (!P.result) { P.result = []; }
                                if (!_.isArray(P.result)) { P.result = [P.result]; }
                                P.result = P.result.concat(v);
                            } else {
                                if (P.result) {
                                    if (!_.isArray(P.result)) {
                                        P.result = [P.result];
                                    }

                                    if (_.isArray(v) && P.flatten) {
                                        P.result = P.result.concat(v);
                                    } else {
                                        P.result[P.result.length] = v;
                                    }
                                } else {
                                    P.result = v;
                                }
                            }
                        }
                    }
                    return !!p;
                },
                trace: function (expr, val, path) {

                    if (expr) {
                        var x = expr.split(";"), loc = x.shift();
                        x = x.join(";");
                        if (val && val.hasOwnProperty(loc)) {
                            P.trace(x, val[loc], path + ";" + loc);
                        } else if (loc === "*") {
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                P.trace(m + ";" + x, v, p);
                            });
                        } else if (loc === "..") {
                            P.trace(x, val, path);
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                typeof v[m] === "object" &&
                                    P.trace("..;" + x, v[m], p + ";" + m);
                            });
                        } else if (/,/.test(loc)) { // [name1,name2,...]
                            for (
                                var s = loc.split(/'?,'?/), i = 0, n = s.length;
                                i < n;
                                i++
                            ) {
                                P.trace(s[i] + ";" + x, val, path);
                            }
                        } else if (/^\(.*?\)$/.test(loc)) {// [(expr)]
                            /* jshint evil: true */
                            P.trace(
                                P.evaluate(
                                    loc, val, path.substr(path.lastIndexOf(";") + 1)
                                ) + ";" + x, val, path);
                        } else if (/^\?\(.*?\)$/.test(loc)) {// [?(expr)]
                            P.walk(loc, x, val, path, function (m, l, x, v, p) {
                                /* jshint evil: true */
                                if (P.evaluate(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) {
                                    P.trace(m + ";" + x, v, p);
                                }
                            });
                        } else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) {
                            // [start:end:step]  phyton slice syntax
                            P.slice(loc, x, val, path);
                        }
                    } else {
                        if (val && (_.isArray(val) || testManaged(val))) {
                            P.store(path, val);
                        }
                    }
                },
                walk: function (loc, expr, val, path, f) {
                    if (val instanceof Array) {
                        for (var i = 0, n = val.length; i < n; i++) {
                            if (i in val) {
                                f(i, loc, expr, val, path);
                            }
                        }
                    }
                    else if (typeof val === "object") {

                        //
                        // check if the object is managing object
                        // to avoid walking non-beez structure object
                        // added by maginemu
                        //
                        if (testManaged(val)) {
                            for (var m in val) {
                                if (val.hasOwnProperty(m)) {
                                    f(m, loc, expr, val, path);
                                }
                            }
                        }
                    }
                },
                slice: function (loc, expr, val, path) {
                    if (val instanceof Array) {
                        var len = val.length, start = 0, end = len, step = 1;
                        loc.replace(
                                /^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g,
                            function ($0, $1, $2, $3) {
                                start = parseInt($1 || start, 10);
                                end = parseInt($2 || end, 10);
                                step = parseInt($3 || step, 10);
                            }
                        );
                        start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                        end   = (end < 0)   ? Math.max(0, end + len)   : Math.min(len, end);
                        for (var i = start; i < end; i += step) {
                            P.trace(i + ";" + expr, val, path);
                        }
                    }
                },
                evaluate: function (x, _v, _vname) {
                    /* jshint evil: true */
                    try {
                        return $ && _v && eval(x);
                    } catch (e) {
                        throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/\^/g, "_a"));
                    } // `@` usecase removed from original
                }
            };
            P.result = P.wrap === true ? [] : undefined;

            var $ = obj;
            if (expr && obj && (P.resultType === "VALUE" || P.resultType === "PATH")) {
                P.trace(
                    P.normalize(expr).replace(/^\$;/, ""),
                    obj,
                    "$"
                );
                if (!_.isArray(P.result) && P.wrap) { P.result = [P.result]; }
                return P.result ? P.result : false;
            }
            return undefined;
        };

        return jsonPath;
    });

})(this);
