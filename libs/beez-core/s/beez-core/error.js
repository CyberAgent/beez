/**
 * @name error.js<beez-core>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp">
 * @overview It is an error class for beez.
 */

(function (global) {

    define(function __BeezError__(require, exports, module) {
        'use strict';

        var suns = require('beez-core/suns');

        /**
         * Beez Error Class
         * @class
         * @name BeezError
         * @extends {suns}
         */
        var BeezError = suns.extend(
            'beez.Error',
            Error,
            {
                /**
                 *
                 * @memberof BeezError
                 * @param {String} message error message
                 */
                constructor: function BeezError(message) {
                    Error.apply(this, arguments);
                    Error.captureStackTrace(this, this.constructor);
                    this.message = message;
                }
            }
        );
        BeezError.extend = suns.extendThis;

        return BeezError;
    });

})(this);
