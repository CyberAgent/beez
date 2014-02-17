/**
 * @fileOverview script init
 * @name bootstrap.js
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var commander = require('commander');
var _ = require('underscore');
var jsonminify = require('jsonminify');
var beezlib = require('beezlib');

var Bootstrap = function Bootstrap() {
    beezlib.setupColorTheme();

    this.config = {
        encode: 'utf8',
        project: {}
    };
    this.message = {};
    this.store = {};
};


module.exports = new Bootstrap();

Bootstrap.prototype.pre = function pre() {
    this.package = JSON.parse(fs.readFileSync(__dirname+ '/../package.json'));
    this.config.cwd = process.cwd();

    // const
    this.config.HOME = __dirname;
    this.config.hbsdir = this.config.HOME + '/hbs'; // skel/hbs
    this.config.beezdir = path.dirname(this.config.HOME);
    this.config.bindir = this.config.beezdir + '/bin';
    this.config.fdir = this.config.beezdir + '/f';
    this.config.sdir = this.config.beezdir + '/s';
    this.config.dist = this.config.beezdir + '/dist';
    this.config.releasedir = this.config.beezdir + '/release';
    this.config.vendordir = this.config.beezdir + '/vendor';

    /**
     * OS Process cache!!
     */
    process.on('uncaughtException', function _uncaughtException(err) {
        beezlib.logger.error(err);
        beezlib.logger.error(err.stack.error);
        process.exit(1);
    });
    process.on('SIGTERM', function _sigterm() {
        beezlib.logger.info("SIGINT has occurrend.\n");
        process.exit(1);
    });
    process.on("SIGINT", function _sigint() {
        beezlib.logger.info('SIGINT has occurred.\n');
        process.exit(1);
    });
};

/**
 * common post function
 */
Bootstrap.prototype.post = function post(callback) {
    callback && callback(null);
};

/**
 * ./project.js init function
 */
Bootstrap.prototype.project = function project(callback) {
    this.pre();
    var P = [
        'todos',
        'simple',
        'github'
    ];

    commander
        .version(this.package.version)
        .description('I want to create a project beez.')
        .option('-d --debug', 'debug mode.')
        .option('-n --name <name>', 'project name')
        .option('-b --base <base>', 'model project (' + P.join("|")+ ') default:todos', 'todos')
        .option('-o --output <path>', 'The destination directory. default) ', this.config.cwd)
        .parse(process.argv)
    ;

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.WARN;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: output
    this.config.output = commander.output || this.config.cwd;

    if (!beezlib.fsys.isDirectorySync(this.config.output)) {
        beezlib.logger.error('"--output" is not a directory. param:', this.config.output);
        process.exit(2);
    }

    // option: name
    this.config.name = commander.name;
    if (!this.config.name) {
        beezlib.logger.error('"--name" or "-n" option does not exist.');
        process.exit(2);
    }

    // option: base
    var _chk_p = _.find(P, function(project) {
        if (project === commander.base) {
            return true;
        }
        return false;
    });
    if (!_chk_p) {
        beezlib.logger.error('Template project does not exist. [' + P.join("|") + '] base:', commander.base);
        process.exit(2);
    }
    this.config.base = commander.base;

    this.config.path = path.normalize(
        path.resolve(this.config.cwd, this.config.output) + '/' + this.config.name);

    if (fs.existsSync(this.config.path)) {
        beezlib.logger.error('Project path already exists. path:', this.config.path);
        process.exit(2);
    }

    beezlib.logger.debug('name:', this.config.name);
    beezlib.logger.debug('output:', this.config.output);
    beezlib.logger.debug('base project:', this.config.base);
    beezlib.logger.debug('path:', this.config.path);

    this.post(callback);
};

/**
 * ./stylus2css.js setup function
 */
Bootstrap.prototype.stylus2css = function stylus2css(callback) {
    // common pre
    this.pre();

    commander
        .version(this.package.version)
        .description('I compile the stylus file under specified basedir.')
        .option('-d --debug', 'debug mode.')
        .option('-c --config <path>', '[necessary] server config path(format: json)')
        .option('-b --basedir <name>', '[necessary] basedir to be compiled project')
        .parse(process.argv)
    ;

    // check option: config
    if (!commander.config) {
        beezlib.logger.error('Please specify the path to the configuration file. -c --config <path>');
        process.exit(2);
    }

    // option: config
    try {
        var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
        _.extend(this.config, loadedconfig);
    } catch (e) {
        beezlib.logger.error(e.message, "path:", commander.config);
        beezlib.logger.debug(e.stack);
        process.exit(2);
    }

    // stat config store
    var stat = this.config.app.stat;
    stat.dir = path.resolve(path.dirname(commander.config), stat.include.from || '.', stat.include.path);
    this.store.stat = new beezlib.fsys.store.JSONStore(stat.dir);

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.INFO;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: --basedir
    if (!commander.basedir) {
        beezlib.logger.error('Please specify basedir: the path to the project to be compiled. -b --basedir <path>');
        process.exit(2);
    }

    this.config.basedir = commander.basedir;

    if (!beezlib.fsys.isDirectorySync(this.config.basedir)) {
        beezlib.logger.error('"--basedir" is not a directory. param:', this.config.basedir);
        process.exit(2);
    }

    this.config.basedir = path.normalize(this.config.basedir);

    beezlib.logger.debug('basedir:', this.config.basedir);


    this.post(callback);
};

/**
 * ./hbs2hbsc.js setup function
 */
Bootstrap.prototype.hbs2hbsc = function hbs2hbsc(callback) {
    this.pre();

    commander
        .version(this.package.version)
        .description('I compile the stylus file under specified basedir.')
        .option('-d --debug', 'debug mode.')
        .option('-c --config <path>', '[necessary] server config path(format: json)')
        .option('-e --env <env>', '(default local')
        .option('-b --basedir <name>', '[necessary] basedir to be compiled project')
        .parse(process.argv)
    ;

    // check option: config
    if (!commander.config) {
        beezlib.logger.error('Please specify the path to the configuration file. -c --config <path>');
        process.exit(2);
    }

    // option: config
    try {
        var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
        _.extend(this.config, loadedconfig);
    } catch (e) {
        beezlib.logger.error(e.message, "path:", commander.config);
        beezlib.logger.debug(e.stack);
        process.exit(2);
    }

    // stat config store
    var stat = this.config.app.stat;
    stat.dir = path.resolve(path.dirname(commander.config), stat.include.from || '.', stat.include.path);
    this.store.stat = new beezlib.fsys.store.JSONStore(stat.dir);

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.WARN;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: --env
    this.config.env = commander.env || 'local';

    // option: --basedir
    if (!commander.basedir) {
        beezlib.logger.error('Please specify basedir: the path to the project to be compiled. -b --basedir <path>');
        process.exit(2);
    }

    this.config.basedir = commander.basedir;

    if (!beezlib.fsys.isDirectorySync(this.config.basedir)) {
        beezlib.logger.error('"--basedir" is not a directory. param:', this.config.basedir);
        process.exit(2);
    }

    this.config.basedir = path.normalize(this.config.basedir);
    this.config.project.dir = path.dirname(this.config.basedir);
    this.config.project.confdir = this.config.project.dir + '/conf';

    beezlib.logger.debug('basedir:', this.config.basedir);

    this.post(callback);
};

/**
 * ./ratioresize.js setup function
 */
Bootstrap.prototype.ratioResize = function ratioResize(callback) {
    // common pre
    this.pre();

    commander
        .version(this.package.version)
        .description('I resize the png file under specified basedir.')
        .option('-d --debug', 'debug mode.')
        .option('-s --source <source>', 'source file.')
        .option('-b --baseratio <baseratio>', 'base ratio(default: 2.0).')
        .option('-c --config <path>', 'server config path.' +
            '\n\tformat: json,' +
            '\n\tdefault:' +
            '\n\t{' +
                '\n\t\t"image": {' +
                    '\n\t\t\t"options": {' +
                    '\n\t\t\t\t"baseRatio": 2.0,  // baseRatio' +
                    '\n\t\t\t\t"ratios": [ 1, 1.3, 1.5, 2, 3 ],  // resize ratio' +
                    '\n\t\t\t\t"separator": "-", // separator' +
                    '\n\t\t\t\t"extnames": [ ".png" ],  // [walk mode option]' +
                    '\n\t\t\t\t"include": [ "." ],  // [walk mode option]' +
                    '\n\t\t\t\t"exclude": []  // [walk mode option]' +
            '\n\t\t\t}\n\t\t}\n\t}')
        .option('-o --output <output>', 'output directory path.')
        .option('-w --walk <walk>', '[walk mode] walk start directory path.')
        .parse(process.argv)
    ;

    if (commander.baseratio) {
        _.extend(this.config, { image: {options: { baseRatio: commander.baseratio } } });
    }

    if (commander.config) {
        // option: config
        try {
            var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
            _.extend(this.config, loadedconfig);
        } catch (e) {
            beezlib.logger.error(e.message, "path:", commander.config);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }
    }

    // check option: config
    if (!commander.source && !commander.walk) {
        beezlib.logger.error('Please specify the path to the source file. -s --source <source>');
        process.exit(2);
    }
    if (commander.source) {
        if (!fs.existsSync(commander.source)) {
            beezlib.logger.error('"-s --source" does not exist. param:', commander.source);
            process.exit(2);
        }
        if (!fs.statSync(commander.source).isFile()) {
            beezlib.logger.error('"-s --source" is not a file. param:', commander.source);
            process.exit(2);
        }
        this.config.sourcePath = path.normalize(commander.source);
    }
    if (commander.walk) {
        if (!beezlib.fsys.isDirectorySync(commander.walk)) {
            beezlib.logger.error('"-w --walk" is not a directory. param:', commander.walk);
            process.exit(2);
        }
        this.config.walkPath = path.normalize(commander.walk);
    }

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.INFO;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    this.post(callback);
};

/**
 * ./csssprite.js setup function
 */
Bootstrap.prototype.csssprite = function csssprite(callback) {
    // common pre
    this.pre();

    commander
        .version(this.package.version)
        .description('I build the sprite file under specified basedir.')
        .option('-d --debug', 'debug mode.')
        .option('-c --config <path>', '[necessary] server config path(format: json)')
        .option('-b --basedir <name>', '[necessary] basedir to be compiled project')
        .parse(process.argv)
    ;

    // check option: config
    if (!commander.config) {
        beezlib.logger.error('Please specify the path to the configuration file. -c --config <path>');
        process.exit(2);
    }

    // option: config
    try {
        var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
        _.extend(this.config, loadedconfig);
    } catch (e) {
        beezlib.logger.error(e.message, "path:", commander.config);
        beezlib.logger.debug(e.stack);
        process.exit(2);
    }

    // stat config store
    var stat = this.config.app.stat;
    stat.dir = path.resolve(path.dirname(commander.config), stat.include.from || '.', stat.include.path);
    this.store.stat = new beezlib.fsys.store.JSONStore(stat.dir);

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.INFO;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: --basedir
    if (!commander.basedir) {
        beezlib.logger.error('Please specify basedir: the path to the project to be compiled. -b --basedir <path>');
        process.exit(2);
    }

    this.config.basedir = commander.basedir;

    if (!beezlib.fsys.isDirectorySync(this.config.basedir)) {
        beezlib.logger.error('"--basedir" is not a directory. param:', this.config.basedir);
        process.exit(2);
    }

    this.config.basedir = path.normalize(this.config.basedir);

    beezlib.logger.debug('basedir:', this.config.basedir);


    this.post(callback);
};

Bootstrap.prototype.deploy = function deploy(callback) {
    // common pre
    this.pre();

    commander
        .version(this.package.version)
        .description('I deploy the content to output under the specified source.')
        .on('--help', function() {
            beezlib.logger.message('example 1)');
            beezlib.logger.message('\t$ beez-deploy -c conf/local.json -s dist/ -o release/local/');
            beezlib.logger.message('example 2)');
            beezlib.logger.message('\t$ beez-deploy -e "\\/([^_\\/]+\\.(html|css|png|jpg|gif|ttf|eot|woff)|index\\.js|require\\.beez[^\\/]+js)$" -s dist/ -o release/local/');
        })
        .option('-d --debug', 'debug mode.')
        .option('-c --config <path>', 'server config path.' +
            '\n\tformat: json,' +
            '\n\texample: local.json' +
            '\n\t{' +
            '\n\t\t"deploy": {' +
            '\n\t\t\t"include": [ "index.js", "require.beez.*.js", "*.html" "*.css", "*.png", "*.jpg", "*.gif", "*.ttf", "*.eot", "*.woff" ],  // [deploy]' +
            '\n\t\t\t"exclude": [ "_*.css", "_*.png", "_*.jpg", "_*.gif", "_*.ttf", "_*.eot", "_*.woff" ]  // [undeploy]' +
            '\n\t\t}\n\t}')
        .option('-s --source <source>', '[necessary] source dir')
        .option('-o --output <path>', '[necessary] output dir')
        .option('-e --regexp <pattern>', 'deploy file')
        .parse(process.argv)
    ;

    if (commander.config) {
        // option: config
        try {
            var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
            _.extend(this.config, { deploy: {} }, loadedconfig);
        } catch (e) {
            beezlib.logger.error(e.message, "path:", commander.config);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }
    } else if (commander.regexp) {
        try {
            _.extend(this.config, { deploy: { regexp: new RegExp(commander.regexp) } });
        } catch (e) {
            beezlib.logger.error(e.message, "pattern:", commander.regexp);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }
    } else {
        beezlib.logger.error('Please specify the pattern. -e --regexp <pattern>');
        process.exit(2);
    }

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.INFO;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: --source
    if (!commander.source) {
        beezlib.logger.error('Please specify source: the path to the project to be compiled. -s --source <path>');
        process.exit(2);
    }

    this.config.source = commander.source;

    if (!beezlib.fsys.isDirectorySync(this.config.source)) {
        beezlib.logger.error('"--source" is not a directory. param:', this.config.source);
        process.exit(2);
    }

    // option: --output
    if (!commander.output) {
        beezlib.logger.error('Please specify output: the path to the project to be compiled. -o --output <path>');
        process.exit(2);
    }

    this.config.output = commander.output;

    if (!beezlib.fsys.isDirectorySync(this.config.output)) {
        beezlib.logger.error('"--output" is not a directory. param:', this.config.output);
        process.exit(2);
    }


    this.config.source = path.normalize(this.config.source);
    this.config.output = path.normalize(this.config.output);

    beezlib.logger.debug('source:', this.config.source);
    beezlib.logger.debug('output:', this.config.output);


    this.post(callback);
};

/**
 * ./ignore.js setup function
 */
Bootstrap.prototype.ignore = function ignore(callback) {
    // common pre
    this.pre();

    commander
        .version(this.package.version)
        .description('I ignore up the under specified basedir.')
        .on('--help', function() {
            beezlib.logger.message('example 1)');
            beezlib.logger.message('\t$ beez-ignore -c conf/local.json -b release/local/');
            beezlib.logger.message('example 2)');
            beezlib.logger.message('\t$ beez-ignore -e "\\/[^\\/]+local\\.develop\\.(js|html)" -b release/local/');
        })
        .option('-d --debug', 'debug mode.')
        .option('-c --config <path>', 'server config path.' +
            '\n\tformat: json,' +
                '\n\texample: local.json' +
                '\n\t{' +
                '\n\t\t"ignore": {' +
                '\n\t\t\t"include": [ "*local.develop.js", "*local.develop.html" ],  // [ignore]' +
                '\n\t\t\t"exclude": []  // [unignore]' +
            '\n\t\t}\n\t}')
        .option('-b --basedir <name>', '[necessary] basedir to be compiled project')
        .option('-e --regexp <pattern>', 'ignore file')
        .parse(process.argv)
    ;

    if (commander.config) {
        // option: config
        try {
            var loadedconfig = beezlib.fsys.readFileMultiConfigureSync(commander.config, 'utf-8');
            _.extend(this.config, { ignore: {} }, loadedconfig);
        } catch (e) {
            beezlib.logger.error(e.message, "path:", commander.config);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }
    } else if (commander.regexp) {
        try {
            _.extend(this.config, { ignore: { regexp: new RegExp(commander.regexp) } });
        } catch (e) {
            beezlib.logger.error(e.message, "pattern:", commander.regexp);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }
    } else {
        beezlib.logger.error('Please specify the pattern. -e --regexp <pattern>');
        process.exit(2);
    }

    // option: debug
    beezlib.logger.level = beezlib.logger.LEVELS.INFO;
    if (commander.debug) {
        beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
    }

    // option: --basedir
    if (!commander.basedir) {
        beezlib.logger.error('Please specify basedir: the path to the project to be compiled. -b --basedir <path>');
        process.exit(2);
    }

    this.config.basedir = commander.basedir;

    if (!beezlib.fsys.isDirectorySync(this.config.basedir)) {
        beezlib.logger.error('"--basedir" is not a directory. param:', this.config.basedir);
        process.exit(2);
    }

    this.config.basedir = path.normalize(this.config.basedir);

    beezlib.logger.debug('basedir:', this.config.basedir);


    this.post(callback);
};
