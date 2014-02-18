#!/usr/bin/env node
/**
 * @fileOverview beez project content deploy.
 * @name deploy.js
 * @author Yuhei Aihara <aihara_yuhei@cyberagent.co.jp>
 */
var path = require('path');
var _ = require('underscore');
var beezlib = require('beezlib');
var Bucks = require('bucks');

var bootstrap = require('./bootstrap');

var DEFAULT_OPTIONS = beezlib.constant.DEPLOY_DEFAULT_OPTIONS;

bootstrap.deploy(function (err) {
    if (err) {
        return beezlib.logger.error(err);
    }
    var config = bootstrap.config;
    beezlib.logger.debug('[ start ]');

    // -- main
    beezlib.logger.debug('HOME:', config.HOME);
    beezlib.logger.debug('locals:', JSON.stringify(config));
    beezlib.logger.debug('options:', JSON.stringify(config.deploy));
    beezlib.logger.message('');
    beezlib.logger.message('  Source Directory:'.green, config.source);
    beezlib.logger.message('  Output Directory:'.green, config.output);

    _.defaults(config.deploy || (config.deploy = {}), DEFAULT_OPTIONS);
    var include = config.deploy.include;
    var exclude = config.deploy.exclude;
    var includeReg = beezlib.regexp.array2regexp(include);
    var excludeReg = beezlib.regexp.array2regexp(exclude);
    beezlib.logger.message('  deploy regexp:'.green, include ? includeReg : 'unused'.grey);
    beezlib.logger.message('  do not deploy regexp:'.green, exclude ? excludeReg : 'unused'.grey);
    beezlib.logger.message('  extend regexp:'.green, config.deploy.regexp || 'unused'.grey);

    // backward compatibility
    if (typeof config.deploy.optipng === 'boolean') {
        config.deploy.optipng = { use: config.deploy.optipng };
    }
    if (typeof config.deploy.jpegoptim === 'boolean') {
        config.deploy.jpegoptim = { use: config.deploy.jpegoptim };
    }

    var bucks = new Bucks();
    bucks.empty();

    beezlib.fsys.walk(config.source, function filefn(prefix, dir, file, stats) {
        var src = path.join(dir, file);
        var dstdir = path.join(config.output, prefix);
        var dst = path.join(dstdir, file);
        if (includeReg.test(src) && !excludeReg.test(src) ||
            config.deploy.regexp instanceof RegExp && config.deploy.regexp.test(src)) {

            // make directory
            bucks.add(function task(err, res, next) {
                beezlib.fsys.mkdirp(dstdir, 0755, function(err, result) {
                    if (err) {
                        beezlib.logger.error(err);
                        return next(err);
                    }
                    if (result) {
                        beezlib.logger.debug('mkdir:', dstdir);
                    } else {
                        beezlib.logger.debug('mkdir:', dstdir, ': File exists');
                    }
                    next();
                });
            });
            // copy
            bucks.add(function task(err, res, next) {
                beezlib.fsys.cp(src, dst, function(err) {
                    if (err) {
                        beezlib.logger.error(err);
                        return next(err);
                    }

                    beezlib.logger.message('deploy:', dst);
                    next();
                });
            });
            // optim
            bucks.add(function task(err, res, next) {
                beezlib.image.optim(dst, config.deploy, next);
            });
        }
    });

    bucks.end(function(err, ress) {
        if (err) {
            beezlib.logger.error(err instanceof Error ? err.message : JSON.stringify(err));
            process.exit(1);
        }

        /**
         * Message output
         */
        beezlib.logger.message('\n');
        beezlib.logger.message('', 'finished.\n');
    });
});