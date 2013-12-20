/**
 * @name uid.js<utils>
 * @author Kazuma MISHIMAGI <mishimagi_kazuma@cyberagent.co.jp>
 * @overview generate uid
 */

(function (global) {
    define(function (require, exports, module) {
        'use strict';
        var uid; // singleton

        /**
         * ユニークなIDを生成する
         * singletonオブジェクトです
         */
        var UID = function () {
            if (uid) { // return singleton
                return uid;
            }
            uid = this;
            return uid;
        };

        /**
         * ユニークなIDを生成します
         * @return {string} unique_id
         */
        UID.prototype.create = function () {
            var randam = Math.floor(Math.random() * 1000);
            var time = Date.now();
            return randam + '_' + time.toString();
        };

        return UID;
    });
})(this);
