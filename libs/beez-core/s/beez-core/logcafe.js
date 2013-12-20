/**
 * @name logcafe.js
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * copyright (c) Cyberagent Inc.
 * @overview browser logging.
 */

(function (global) {
    'use strict';

    /**
     * Empty function
     * @function
     * @private
     */
    var none = function none() {};

    /**
     * Logger class
     * @class
     * @name Logger
     */
    var Logger = function Logger(category, config) {
        this.initialize(category, config);
    };

    Logger.prototype = {
        /**
         * Logger constructor
         * @param {String} category
         * @param {JSON} config config data
         * @memberof Logger
         * @instance
         */
        initialize: function initialize(category, config) {
            this.category = category;
            this.config = config;
            this.level = this.config.level;

            if (this.config.separator) {
                this.separator = this.config.separator || ' ';
            }

            if (this.level === this.LEVELS.TRACE) {
                // pass
            } else if (this.level === this.LEVELS.DEBUG) {
                this.trace = none;
            } else if (this.level === this.LEVELS.INFO) {
                this.trace = this.debug = none;
            } else if (this.level === this.LEVELS.WARN) {
                this.trace = this.debug = this.info = none;
            } else if (this.level === this.LEVELS.ERROR) {
                this.trace = this.debug = this.info = this.warn = none;
            } else {
                // pass
            }
        },

        /**
         * Log level
         * @const {string} LEVELS
         * @memberOf Logger
         */
        LEVELS: {
            'OFF': 'OFF',
            'TRACE': 'TRACE',
            'DEBUG': 'DEBUG',
            'INFO': 'INFO',
            'WARN': 'WARN',
            'ERROR': 'ERROR'
        },

        /**
         * Exclude category forward match
         * @memberOf Logger
         * @instance
         * @function
         * @private
         */
        _exclude: function _exclude() {
            if (this.config.excludes && 0 < this.config.excludes.length) {
                for (var i = 0; i < this.config.excludes.length; i++) {
                    var reg = new RegExp('^' + this.config.excludes[i]);
                    if (this.category.match(reg)) {
                        return true;
                    }
                }
            }
            return false;
        },


        /**
         * trace method
         * @memberOf Logger
         * @instance
         * @function
         */
        trace: function trace() {
            !this._exclude() && console.debug(this.output('trace', arguments));
        },

        /**
         * debug output method
         * @memberOf Logger
         * @instance
         * @function
         */
        debug: function debug() {
            !this._exclude() && console.debug(this.output('debug', arguments));
        },

        /**
         * info output method
         * @memberOf Logger
         * @instance
         * @function
         */
        info : function info() {
            !this._exclude() && console.info(this.output('info', arguments));
        },

        /**
         * warn output method
         * @instance
         * @memberOf Logger
         * @function
         */
        warn : function warn() {
            !this._exclude() && console.warn(this.output('warn', arguments));
        },

        /**
         * error output method
         * @instance
         * @memberOf Logger
         * @function
         */
        error: function error() {
            !this._exclude() && console.error(this.output('error', arguments));
        },

        /**
         * Generates a log record.
         * @memberof Logger
         * @instance
         * @function
         * @param {String} level log level
         * @param {Array} _arguments log datas
         * @return {String}
         */
        output: function output(level, _arguments) {
            var args = Array.prototype.slice.call(_arguments);

            for (var i = 0; i < args.length; i++) {
                if (args[i] === undefined) {
                    args[i] = '"undefined"';
                } else if (args[i] === null) {
                    args[i] = '"null"';
                } else if ((args[i] instanceof Error) || (args[i].constructor.name === 'Error')) {
                    var err = args[i];
                    err.stack ? args[i] = err.stack : args[i] = err.message;
                } else if (typeof args[i] === 'object') {
                    args[i] = args[i].constructor.name + ':' + JSON.stringify(args[i]);
                }
            }

            var suffix = '';
            var stack = new Error().stack;
            var lines, line, idx;
            if (stack) {
                lines = stack.split('\n');
                if (lines[3]) {
                    line = lines[3];
                    idx = line.indexOf('(');
                    if (idx >= 0) {
                        suffix = line.substring(idx);
                        if (suffix.charAt(suffix.length - 1) !== ')') {
                            suffix = '(' + suffix + ')';
                        }
                    } else {
                        suffix = '(' + line.replace(/[ ]*at /, '') + ')';
                    }
                } else if (lines[2]) {
                    line = lines[2];
                    idx = line.indexOf('@');
                    if (idx >= 0) {
                        suffix = line.substring(idx + 1);
                        suffix = ' (' + suffix + ')';
                    }

                }
            }

            return '[' + level + '][' + this.category + '] ' + args.join(this.separator) + ' ' + suffix;
        }
    };


    /**
     * Logging model
     * @class
     * @name LogCafe
     */
    var LogCafe = function LogCafe(config) {
        this.initialize(config);
    };
    LogCafe.prototype = {
        /**
         * Logging model
         * @memberof LogCafe
         * @instance
         */
        initialize: function initialize(config) {
            this.config = config;
            this.loggers = {};
        },

        /**
         * Setting up a configuration file.
         * @memberof LogCafe
         * @instance
         * @function
         * @public
         * @param {JSON} config config data
         */
        setConfigure: function setConfigure(config) {
            this.config = config;
            return this;
        },

        /**
         * Get Logger
         * @memberof LogCafe
         * @instance
         * @function
         * @public
         * @param {String} category
         * @return {Logger}
         */
        getLogger: function getLogger(category) {
            if (this.loggers[category]) {
                return this.loggers[category];
            }
            this.loggers[category] = new Logger(category, this.config);
            return this.loggers[category];

        }
    };

        /**
         * Version
         * @memberof LogCafe
         * @public
         */
    LogCafe.VERSION = '0.6.7';

    if (typeof define === 'function' && define.amd) {
        // requirejs
        define(function (require, exports, module) {
            return LogCafe;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node
        module.exports = LogCafe;
    } else {
        // others, export global
        global.LogCafe = LogCafe;
    }
})(this);
