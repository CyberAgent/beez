#!/usr/bin/env node
/**
 * @fileOverview bez project csssprite builder.
 * @name csssprite.js
 * @author Yuhei Aihara <aihara_yuhei@cyberagent.co.jp>
 */
var path = require('path');

var beezlib = require('beezlib');
var Bucks = require('bucks');

var bootstrap = require('./bootstrap');

bootstrap.csssprite(function (err) {
    if (err) {
        return beezlib.logger.error(err);
    }
    var config = bootstrap.config;
    var bucks = new Bucks();
    bucks.add(function task() {
        beezlib.logger.debug('[ start ]');

        // -- main
        beezlib.logger.debug('HOME:', config.HOME);
        beezlib.logger.debug('locals:', JSON.stringify(config));
        beezlib.logger.debug('options:', JSON.stringify(config.sprite.options));
    });

    var ret = [];
    beezlib.fsys.walk(config.basedir, function filefn(prefix, dir, file, stats) {
        if (!beezlib.css.sprite.isSpriteImage(file, config.sprite.options) ||
            ~ret.indexOf(path.join(dir, file))) {
            return;
        }

        var group = beezlib.css.sprite.getGroup(file, config.sprite.options);
        var images = beezlib.css.sprite.getImages(dir, group, config.sprite.options);
        ret = ret.concat(images);

        bucks.add(function task(err, res, next) {
            beezlib.css.sprite.build(dir, group, images, config.sprite.options, function(err) {
                if (err) {
                    beezlib.logger.error("csssprite build error. file:", file, 'dir:', dir);
                    beezlib.logger.error(JSON.stringify(err));
                    process.exit(1);
                }

                next();
            });
        });
    });

    bucks.end(function(err, ress) {
        if (err) {
            beezlib.logger.error(JSON.stringify(err));
            process.exit(1);
        }

        /**
         * Message output
         */
        beezlib.logger.message('sprite build'.green);
        beezlib.logger.message('');
        beezlib.logger.message('  Base Directory:'.green, config.basedir.silly);
        beezlib.logger.message('\n');
        beezlib.logger.message('', 'finished.\n');
    });
});