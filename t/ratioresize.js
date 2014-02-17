#!/usr/bin/env node
/**
 * @fileOverview beez project *.png -> *-{ratio}.png resize.
 * @name ratioresize.js
 * @author Yuhei Aihara <aihara_yuhei@cyberagent.co.jp>
 */
var path = require('path');

var _ = require('underscore');
var beezlib = require('beezlib');
var Bucks = require('bucks');

var bootstrap = require('./bootstrap');

var DEFAULT_OPTIONS = beezlib.constant.IMAGE_RATIORESIZE_DEFAULT_OPTIONS;

bootstrap.ratioResize(function (err, result) {
    var config = bootstrap.config;
    config.image = config.image || {};
    var options = _.defaults(config.image.options || (config.image.options = {}), DEFAULT_OPTIONS);
    beezlib.logger.debug('[ start ]');

    // -- main
    beezlib.logger.debug('HOME:', config.HOME);
    beezlib.logger.debug('locals:', JSON.stringify(config));
    beezlib.logger.debug('options:', JSON.stringify(options));
    beezlib.logger.message('png/{ratio}.png Resize'.green);
    beezlib.logger.message('');
    beezlib.logger.message('  Base Directory:'.green, config.walkPath || path.dirname(config.sourcePath));

    var bucks = new Bucks();
    bucks.empty();

    if (config.walkPath) {

        options.include.push(config.walkPath); // add command-line options -w

        beezlib.fsys.walk(config.walkPath, function filefn(prefix, dir, file, stats) {
            var src = path.join(dir, file);
            if (!beezlib.image.isResizeImage(src, options)) {
                beezlib.logger.debug("Skip file. path:", dir + '/' + file);
                return;
            }

            bucks.add(function task(err, res, next) {
                beezlib.image.imagemagick.ratioResize(
                    {
                        srcPath: src,
                        dstPath: dir
                    },
                    options.baseRatio,
                    options.ratios,
                    function (err, ress) {
                        if (err) {
                            beezlib.logger.error("png resize error. file:", file, 'dir:', dir);
                            beezlib.logger.error(JSON.stringify(err));
                            process.exit(1);
                        }
                        beezlib.logger.message('\n  ', src);
                        for (var i = 0; i < ress.length; i++) {
                            var output = ress[i];
                            beezlib.logger.message('  ', output.green);
                        }
                        next();
                    }
                );
            });
        });
    } else {
        var src = config.sourcePath;
        var dir = path.dirname(src);
        var file = path.basename(src);
        bucks.add(function task(err, res, next) {
            beezlib.image.imagemagick.ratioResize(
                {
                    srcPath: src,
                    dstPath: dir
                },
                options.baseRatio,
                options.ratios,
                function (err, ress) {
                    if (err) {
                        beezlib.logger.error("png resize error. file:", file, 'dir:', dir);
                        beezlib.logger.error(JSON.stringify(err));
                        process.exit(1);
                    }
                    beezlib.logger.message('\n  ', src);
                    for (var i = 0; i < ress.length; i++) {
                        var output = ress[i];
                        beezlib.logger.message('  ', output.green);
                    }
                    next();
                }
            );
        });
    }

    bucks.end(function(err, ress) {
        if (err) {
            beezlib.logger.error(JSON.stringify(err));
            process.exit(1);
        }

        beezlib.logger.message('\n');
        beezlib.logger.message('finished.\n');
    });
});
