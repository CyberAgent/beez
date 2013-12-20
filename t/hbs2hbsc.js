#!/usr/bin/env node
/**
 * @fileOverview beez project hbs -> hbsc.js compile.
 * @name hbs2hbsc.js
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */
var path = require('path');
var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('./bootstrap');

var DEFAULT_OPTIONS = beezlib.constant.BOOTSTRAP_DEFAULT_OPTIONS;
var REG_HBS = beezlib.constant.REG_HBS;
var REG_HBSP = beezlib.constant.REG_HBSP;

bootstrap.hbs2hbsc(function (err, result) {
    var config = bootstrap.config;
    var encode = config.encode;
    var message = bootstrap.message;
    message.files = [];
    message.dirs = [];

    beezlib.logger.debug('[ start ]');

    // -- main
    beezlib.logger.debug('HOME:', config.HOME);
    beezlib.logger.debug('locals:', JSON.stringify(config));

    _.defaults(config.bootstrap || (config.bootstrap = {}), DEFAULT_OPTIONS);
    var index_html_hbs_paths = config.bootstrap.html;
    var data_main_hbs_paths = config.bootstrap.datamain;
    var index_html_hbs_reg = beezlib.regexp.array2regexp(index_html_hbs_paths);
    var data_main_hbs_reg = beezlib.regexp.array2regexp(data_main_hbs_paths);

    beezlib.fsys.walk(config.basedir, function filefn(prefix, dir, file, stats) {
        var store = bootstrap.store;
        var abspath, dstpath, mode;
        if (data_main_hbs_reg.test(path.join(dir, file))) {
            for (mode in store.stat.mapping) {
                abspath = path.normalize(dir + '/require.beez.' + config.env + '.' + mode  + '.js');
                dstpath = beezlib.template.requirehbs2hbsc(abspath, file, store, encode);
                message.files.push(dstpath);
            }
        } else if (index_html_hbs_reg.test(path.join(dir, file))) {
            for (mode in store.stat.mapping) {
                var file_prefix = file.replace(beezlib.constant.REG_HTML_HBS, '.');
                abspath = path.normalize(dir + '/' + file_prefix + config.env + '.' + mode + '.html');
                dstpath = beezlib.template.hbs2hbsc2html(abspath, file, store, encode);
                message.files.push(dstpath);
            }
        } else if (REG_HBS.test(file)) {
            dstpath = beezlib.template.hbs2hbscjs(dir, file, encode);
            message.files.push(dstpath);
        } else if (REG_HBSP.test(file)) {
            dstpath = beezlib.template.hbsp2hbspjs(dir, file, encode);
            message.files.push(dstpath);
        }
    });


    /**
     * Message output
     */
    beezlib.logger.message("hbs/hbsp Compile".green);
    beezlib.logger.message("");
    beezlib.logger.message("  Base Directory:".green, config.basedir.silly);
    beezlib.logger.message("");
    beezlib.logger.message("  comile hbsc.js/hbsp.js file:".green);
    for (var i = 0; i < message.files.length; i++) {
        var output = message.files[i];
        beezlib.logger.message("  ", output.green);
    }

    beezlib.logger.message('\n');
    beezlib.logger.message('', 'finished.\n');
});
