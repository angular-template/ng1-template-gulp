'use strict';

let gulp = require('gulp');
let $ = require('gulp-load-plugins')({lazy: true});
let _ = require('lodash');

let config = require('../config');
let utils = require('./misc');

// Read the command line arguments
let args = require('yargs').argv;
let port = process.env.PORT || config.server.nodeHostPort;
let environment = args.env || config.config.defaultEnv;
let launch = args.launch;
let customHost = args.customHost;

const absoluteUrlPattern = /https?:\/\//;

// Update config.preferences.launchBrowserOnServe
if (launch && launch !== undefined) {
    if (launch === 1) {
        config.preferences.launchBrowserOnServe = true;
    } else if (typeof launch === 'string') {
        if (!_.startsWith(launch, '/') && !absoluteUrlPattern.test(launch)) {
            launch = `/${launch}`;
        }
        config.preferences.launchBrowserOnServe = launch;
    } else {
        config.preferences.launchBrowserOnServe = false;
    }
}
if (config.preferences.launchBrowserOnServe === undefined) {
    config.preferences.launchBrowserOnServe = true;
}

function tryLaunchBrowser(port) {
    let open = require('open');
    if (typeof config.preferences.launchBrowserOnServe === 'string') {
        let url = config.preferences.launchBrowserOnServe;
        if (absoluteUrlPattern.test(url)) {
            open(url);
        } else {
            open(`http://localhost:${port}${url}`)
        }
    } else if (config.preferences.launchBrowserOnServe) {
        open(`http://localhost:${port}`);
    }
}

//Note: There is an issue with gulp.watch that prevents it from detecting new or deleted files
//if the glob is absolute or starts with './'. Hence the code below to fix it.
//See: http://stackoverflow.com/a/26851844
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

module.exports = function(isDev) {
    //Before serving, keep watch for changes to any Typescript or LESS files, so they are
    //automatically recompiled. This applies only to DEV mode.
    if (isDev) {
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

        let staticsToWatch = fixPaths([].concat(
            `${config.folders.assets}**/*.+(png|jpg|jpeg|svg|gif|ico)`,
            `${config.folders.assets}**/*.+(eot|ttf|woff|woff2|otf)`
        ));
        let staticsWatcher = gulp.watch(staticsToWatch, ['watch:statics_handler']);
        logChanges(staticsWatcher);

        if (config.styles.usesSass) {
            //TODO: Handle SASS
        }

        let configWatcher = gulp.watch(config.config.src, ['watch:config_handler']);
        logChanges(configWatcher);
    }

    //If the customHost option is specified, assume that an external web server
    //is already set-up on the config.server.customHostPort port and simply open
    //the browser on that port.
    if (customHost) {
        tryLaunchBrowser(config.server.customHostPort);
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
            tryLaunchBrowser(port);
        })
        .on('crash', () => {
            utils.log('[nodemon] Crashed')
        })
        .on('exit', () => {
            utils.log('[nodemon] Exited cleanly')
        });
}
