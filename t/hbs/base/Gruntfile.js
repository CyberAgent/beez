(function () {

    var beez = {
        env: 'local',
        projectname: '{{name}}'
    };

    module.exports = function (grunt) {
        // enviroment
        beez.projectdir = grunt.file.findup(beez.projectname);
        grunt.log.ok('[environment] project name:', beez.projectname);
        grunt.log.ok('[environment] project directory:', beez.projectdir);

        // command-options
        beez.env = grunt.option('env') || 'local';
        grunt.log.ok('[options] env:', beez.env);


        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            clean: {
                src: ['dist', 'release', 'docs']
            },
            jshint: {
                src: ['s'],
                options: {
                    jshintrc: '.jshintrc',
                    jshintignore: ".jshintignore"
                }
            },
            mkdir: {
                docs: {
                    options: {
                        mode: 0755,
                        create: ['docs']
                    }
                },
                release: {
                    options: {
                        mode: 0755,
                        create: ['release/' + beez.env]
                    }
                }
            },
            copy: {
                vendor: {
                    files: [
                        {
                            src: ['vendor/**'],
                            dest: 'release/' + beez.env + '/'
                        }
                    ]
                }
            },
            jsdoc : {
                dist : {
                    src: ['s'],
                    options: {
                        lenient: true,
                        recurse: true,
                        private: true,
                        destination: 'docs',
                        configure: '.jsdoc.json'
                    }
                }
            },
            exec: {
                beez_hbs2hbsc: {
                    command: 'beez-hbs2hbsc -b s -e ' + beez.env + ' -c conf/' + beez.env + '.json',
                    stdout: true,
                    stderr: true
                },
                beez_rjs: {
                    command: './node_modules/requirejs/bin/r.js -o build.' + beez.env + '.js',
                    stdout: true,
                    stderr: true
                },
                beez_csssprite: {
                    command: 'beez-csssprite -b s -c conf/' + beez.env + '.json',
                    stdout: true,
                    stderr: true
                },
                beez_stylus2css: {
                    command: 'beez-stylus2css -b s -c conf/' + beez.env + '.json',
                    stdout: true,
                    stderr: true
                },
                beez_deploy: {
                    command: 'beez-deploy -c conf/' + beez.env + '.json -s dist -o release/' + beez.env,
                    stdout: true,
                    stderr: true
                },
                beez_ignore: {
                    command: 'beez-ignore -c conf/' + beez.env + '.json -b release/' + beez.env,
                    stdout: true,
                    stderr: true
                },
                beez_foundation: {
                    command: 'beez-foundation -c conf/' + beez.env + '.json -a {{name}}:' + beez.projectdir,
                    stdout: true,
                    stderr: true
                }
            }
        });

        // These plugins provide necessary tasks.
        require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

        // task: foundation
        grunt.registerTask('foundation', [
            'exec:beez_foundation'
        ]);

        /**
         * task: build
         *
         * s(beez_csssprite,beez_stylus2css,beez_hbs2hbsc) -> dist(beez_rjs)
         */
        grunt.registerTask('build', [
            'jshint',
            'exec:beez_csssprite',
            'exec:beez_stylus2css',
            'exec:beez_hbs2hbsc',
            'exec:beez_rjs'
        ]);

        /**
         * task: deploy
         *
         * dist(build) -> release(deploy) -> release(ignore)
         */
        grunt.registerTask('deploy', [
            'mkdir:release',
            'exec:beez_deploy',
            'exec:beez_ignore',
            'copy:vendor'
        ]);

        // task: docs
        grunt.registerTask('docs', [
            'mkdir:docs',
            'jsdoc'
        ]);

        // task: defulat
        grunt.registerTask('default', [
            'clean',
            'build',
            'deploy'
        ]);

    };
})(this);
