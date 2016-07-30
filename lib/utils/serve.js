'use strict';

let gulp = require('gulp');
let $ = require('gulp-load-plugins')({lazy: true});
let _ = require('lodash');

let config = require('../config');
let utils = require('./misc');

let args = require('yargs').argv;
let port = process.env.PORT || config.server.nodeHostPort;
let environment = args.env || config.config.defaultEnv;
let launch = args.launch;
let customHost = args.customHost;

module.exports = function(isDev) {
    //Before serving, keep watch for changes to any Typescript or LESS files, so they are
    //automatically recompiled. This applies only to DEV mode.
    //Note: There is an issue with gulp.watch that prevents it from detecting new or deleted files
    //if the glob is absolute or starts with './'. Hence the code below to fix it.
    //See: http://stackoverflow.com/a/26851844
    if (isDev) {
        function fixPaths(paths) {
            return paths.map(path => {
                if (_.startsWith(path, '!./')) {
                    return `!${path.substr(3)}`;
                } else if (_.startsWith(path, './')) {
                    return path.substr(2);
                } else {
                    return path;
                }
            });
        }

        function logChanges(watcher) {
            watcher.on('change', ev => {
                utils.log(`[${ev.type}] ${ev.path}`, $.util.colors.blue.bgWhite);
            });
        }

        let tsToWatch = fixPaths([].concat(
            `${config.folders.modules}app.ts`,
            `${config.folders.modules}**/*.ts`,
            `!${config.folders.modules}**/*.module.ts`
        ));
        let tsWatcher = gulp.watch(tsToWatch, ['watch:ts_handler']);
        logChanges(tsWatcher);

        let cssToWatch = fixPaths([].concat(
            `${config.folders.assets}**/*.css`,
            `${config.folders.modules}**/*.css`
        ));
        let cssWatcher = gulp.watch(cssToWatch, ['watch:css_handler']);
        logChanges(cssWatcher);

        if (config.styles.usesLess) {
            let lessToWatch = fixPaths([
                `${config.folders.assets}**/*.less`,
                `${config.folders.modules}**/*.less`
            ]);
            let lessWatcher = gulp.watch(lessToWatch, ['watch:less_handler']);
            logChanges(lessWatcher);
        }

        if (config.styles.usesSass) {
            //TODO: Handle SASS
        }

        let configWatcher = gulp.watch(config.config.src, ['watch:config_handler']);
        logChanges(configWatcher);
    }

    let open = require('open');

    //If the customHost option is specified, assume that an external web server
    //is already set-up on the config.server.customHostPort port and simply open
    //the browser on that port.
    if (customHost) {
        if (launch) {
            open(`http://localhost:${config.server.customHostPort}`);
        }
        return;
    }

    let nodeOptions = {
        script: config.server.entryPoint,
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'dist'
        },
        watch: ['./server/server.js']
    };
    return $.nodemon(nodeOptions)
        .on('restart', () => {
            console.log('[nodemon] Restarted');
        })
        .on('start', () => {
            utils.log(`[nodemon] Starting on port ${port}`);
            if (launch || (typeof launch !== 'undefined')) {
                if (launch === 1) {
                    open(`http://localhost:${port}`);
                } else if (typeof launch === 'string') {
                    open(`http://localhost:${port}${launch}`);
                }
            } else {
                open(`http://localhost:${port}`);
            }

        })
        .on('crash', () => {
            utils.log('[nodemon] Crashed')
        })
        .on('exit', () => {
            utils.log('[nodemon] Exited cleanly')
        });
}
