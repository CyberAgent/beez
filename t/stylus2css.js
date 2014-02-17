#!/usr/bin/env node
/**
 * @fileOverview beez project stylus -> css compile.
 * @name stylus2css.js
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */
var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var commander = require('commander');
var beezlib = require('beezlib');

var bootstrap = require('./bootstrap');

var DEFAULT_OPTIONS = beezlib.constant.CSS_STYLUS_DEFAULT_OPTIONS;
var REG_STYLUS2CSS_FILE = beezlib.constant.REG_STYLUS2CSS_FILE;
var REG_STYL = beezlib.constant.REG_STYL;
var EXTENSION_CSS = beezlib.constant.EXTENSION_CSS;

bootstrap.stylus2css(function (err) {
    if (err) {
        return beezlib.logger.error(err);
    }
    var config = bootstrap.config;
    var message = bootstrap.message;
    message.files = [];
    message.copied = [];
    config.stylus = config.stylus || {};
    var options = _.defaults(config.stylus.options || (config.stylus.options = {}), DEFAULT_OPTIONS);

    beezlib.logger.debug('[ start ]');

    // -- main
    beezlib.logger.debug('HOME:', config.HOME);
    beezlib.logger.debug('locals:', JSON.stringify(config));

    // compile .styl files into .css files in same dir
    beezlib.fsys.walk(config.basedir, function filefn(prefix, dir, file, stats) {
        if (!REG_STYLUS2CSS_FILE.test(file)) {
            return;
        }

        var src = path.join(dir, file);
        var dst = path.normalize(src.replace(REG_STYL, EXTENSION_CSS));

        beezlib.css.stylus.write(src, dst, {options: options}, function(err, css) {
            if (err) {
                beezlib.logger.error("stylus compile error. src:", src, 'dst:', dst);
                beezlib.logger.error(err);
                process.exit(1);
            }
            message.files.push(dst);

        });
    });

    /**
     * Message outpu
     */
    beezlib.logger.message("Stylus Compile".green);
    beezlib.logger.message("");
    beezlib.logger.message("  Base Directory:".green, config.basedir.silly);
    beezlib.logger.message("");
    beezlib.logger.message("  comiled css file:".green);
    var i, output;
    for (i = 0; i < message.files.length; i++) {
        output = message.files[i];
        beezlib.logger.message("  ", output.green);
    }
    beezlib.logger.message("  copied css file:".green);
    for (i = 0; i < message.copied.length; i++) {
        output = message.copied[i];
        beezlib.logger.message("  ", output.green);
    }

    beezlib.logger.message('\n');
    beezlib.logger.message('', '---> Good luck to you :)\n'.silly);
});
