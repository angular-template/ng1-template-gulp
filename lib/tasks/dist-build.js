'use strict';

let fs = require('fs');
let path = require('path');

let gulp = require('gulp');
let sequence = require('run-sequence');
let merge = require('merge2');
let _ = require('lodash');
let $ = require('gulp-load-plugins')({lazy: true});

let config = require('../config');

let utils = require('../utils');
let tsks = utils.taskNames;

let args = require('yargs').argv;

gulp.task(tsks.dist.serve, done => {
    let tasks = ['dist:serve', done];
    let distFolder = path.resolve(config.folders.distBuild);
    if (args.noBuild == undefined || !fs.existsSync(distFolder)) {
        tasks.unshift(tsks.dist.build);
    }
    sequence.apply(this, tasks);
});

gulp.task('dist:serve', done => {
    utils.serve(false);
    done();
});

gulp.task(tsks.dist.build, done => {
    utils.log('Building the distribution deployment of the application.');

    let tasks = [
        tsks.dist.clean,
        tsks.dev.build,
        'create_env_configs',
        'copy_to_dist',
        'inject_ng_templates',
        'optimize_build',
        'copy_webserver_configs_to_dist',
        done
    ];
    if (!config.preferences.vetBeforeDevBuild) {
        tasks.unshift(tsks.vet._lintTs);
    }
    sequence.apply(this, tasks);
});

gulp.task(tsks.dist.clean, done => {
    utils.clean(config.folders.distBuild, done);
});

gulp.task('create_env_configs', done => {
    if (!config.config.generateEnvs || config.config.generateEnvs.length === 0) {
        done();
        return;
    }

    utils.log('Creating environment-specific config files.');

    let tasks = config.config.generateEnvs.map(env =>
        utils.src(config.config.src, 'env-config')
            .pipe($.ngConfig(config.config.moduleName, {
                environment: env,
                createModule: false
            }))
            .pipe($.rename(`config.${env}.js`))
            .pipe(gulp.dest(config.folders.devBuildScripts))
    );
    return merge(tasks);
});

gulp.task(tsks.inject.ngTemplates, [tsks.ngTemplateCache.generate], () => {
    utils.log('Injecting Angular templates caches')
    let task = utils.src(config.shell.file, 'ng-templates');

    task = config.modules.reduce((taskResult, mod) => {
        return taskResult.pipe($.inject(
            gulp.src(`${config.folders.devBuildScripts}${mod.name}/${mod.name}-templates.js` , {read: false}), {
                starttag: `<!-- inject:${mod.name}-templates:js -->`
            }
        ));
    }, task);

    return task.pipe(gulp.dest(config.folders.client));
});

gulp.task(tsks.ngTemplateCache.generate, () => {
    utils.log('Generating Angular template caches.');

    //TODO: Option to not minify for troubleshooting
    let tasks = config.modules.map(mod =>
        utils.src(mod.htmls.toCache, 'template-cache')
            .pipe($.htmlmin(config.options.htmlMin))
            .pipe($.angularTemplatecache(`${mod.name}-templates.js`, {
                module: mod.name,
                standAlone: false,
                root: mod.htmls.root
            }))
            .pipe(gulp.dest(`${config.folders.devBuildScripts}${mod.name}/`))
    );
    return merge(tasks);
});

gulp.task('copy_to_dist', () => {
    utils.log('Copying config, images, fonts and non-cached HTML templates to the dist folder.');
    let configCopyTask = utils.src(config.config.generatedFiles, 'copy-to-dist')
        .pipe(gulp.dest(config.folders.distBuild));
    return merge(getStyleAssetsCopyTasks(
        config.folders.distBuild,
        `${config.folders.distBuild}css/`,
        true
    ).concat(configCopyTask));
});

gulp.task('optimize_build', () => {
    utils.log('Performing optimization for dist - bundling, minification and cache busting.');

    function isNotHtml(file) {
        const htmlExt = '.html';
        //TODO: Replace with lodash call
        return !file || !file.path || file.path.length < htmlExt.length ||
            file.path.substr(file.path.length - htmlExt.length).toLowerCase() !== htmlExt;
    }

    return gulp.src(config.shell.file)
        .pipe($.useref({searchPath: './'}))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.csso()))
        .pipe($.if(isNotHtml, $.rev()))
        .pipe($.revReplace())
        .pipe(gulp.dest(config.folders.distBuild))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.folders.distBuild));
});

gulp.task('rename_rev_shell', ['load_rev_manifest'], done => {
    // let manifest = require(`${config.folders.distBuild}rev-manifest.json`);
    let manifest = config.revManifest;
    let revFileName = manifest['index.html']; //TODO: Use config instead of string literal
    if (!revFileName) {
        done();
        return;
    }

    let vinylPaths = require('vinyl-paths');
    let del = require('del');
    return gulp.src(`${config.folders.distBuild}${revFileName}`)
        .pipe(vinylPaths(del))
        .pipe($.rename('index.html')) //TODO: Use config instead of string literal
        .pipe(gulp.dest(config.folders.distBuild));
});

gulp.task('copy_webserver_configs_to_dist', () => {
    utils.log('Copying custom web server configurations to the dist folder.');
    let tasks = [];
    for (let webServer in config.webServerConfigs) {
        if (!config.webServerConfigs.hasOwnProperty(webServer)) {
            continue;
        }
        utils.log(`    Found web server config for: ${webServer}`);
        let cfg = config.webServerConfigs[webServer];
        let task = gulp.src(config.folders.webserver + cfg.src)
            .pipe(gulp.dest(config.folders.distBuild + (cfg.dest || '')));
        tasks.push(task);
    }
    return merge(tasks);
});

function getStyleAssetsCopyTasks(rootFolder, cssFolder, optimizeImages) {
    let imageTasks = _.values(config.staticFiles.images)
        .map(imgFn => imgFn(rootFolder, cssFolder))
        .map(details => {
            let task = utils.src([].concat(details.src), 'static-images')
            //TODO: Issue with image-min. Revisit.
            //if (optimizeImages) {
            //    task = task.pipe($.imagemin({optimizationLevel: 4}));
            //}
            return task.pipe(gulp.dest(details.dest));
        });

    let fontTasks = _.values(config.staticFiles.fonts)
        .map(fontFn => fontFn(rootFolder, cssFolder))
        .map(details => {
            return utils.src([].concat(details.src), 'static-fonts')
                .pipe(gulp.dest(details.dest));
        });

    return imageTasks.concat(fontTasks);
}
