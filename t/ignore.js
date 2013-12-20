#!/usr/bin/env node
/**
 * @fileOverview beez project ignore up.
 * @name ignore.js
 * @author Yuhei Aihara <aihara_yuhei@cyberagent.co.jp>
 */
var path = require('path');
var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('./bootstrap');

var DEFAULT_OPTIONS = beezlib.constant.IGNORE_DEFAULT_OPTIONS;

bootstrap.ignore(function (err) {
    if (err) {
        return beezlib.logger.error(err);
    }
    var config = bootstrap.config;
    beezlib.logger.debug('[ start ]');

    // -- main
    beezlib.logger.debug('HOME:', config.HOME);
    beezlib.logger.debug('locals:', JSON.stringify(config));
    beezlib.logger.debug('options:', JSON.stringify(config.ignore));
    beezlib.logger.message('');
    beezlib.logger.message('  Base Directory:'.green, config.basedir);

    _.defaults(config.ignore || (config.ignore = {}), DEFAULT_OPTIONS);
    var include = config.ignore.include;
    var exclude = config.ignore.exclude;
    var includeReg = beezlib.regexp.array2regexp(include);
    var excludeReg = beezlib.regexp.array2regexp(exclude);
    beezlib.logger.message('  remove regexp:'.green, include ? includeReg : 'unused'.grey);
    beezlib.logger.message('  do not remove regexp:'.green, exclude ? excludeReg : 'unused'.grey);
    beezlib.logger.message('  extend regexp:'.green, config.ignore.regexp || 'unused'.grey);

    beezlib.fsys.walk(config.basedir, function filefn(prefix, dir, file, stats) {
        var src = path.join(dir, file);
        if (includeReg.test(src) && !excludeReg.test(src) ||
            config.ignore.regexp instanceof RegExp && config.ignore.regexp.test(src)) {
            beezlib.fsys.rmrfSync(src);
            beezlib.logger.message('[remove]', src);
        }
    });

    /**
     * Message output
     */
    beezlib.logger.message('\n');
    beezlib.logger.message('', 'finished.\n');
});