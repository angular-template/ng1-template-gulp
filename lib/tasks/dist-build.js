'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let merge = require('merge2');
let $ = require('gulp-load-plugins')({lazy: true});

let config = require('../config');

let utils = require('../utils');
let tsks = utils.taskNames;

gulp.task(tsks.dist.serve, [tsks.dist.build], () => {
    utils.serve(false);
});

gulp.task(tsks.dist.build, done => {
    utils.log('Building the distribution deployment of the application.');

    sequence('vet',
        tsks.dist.clean,
        tsks.dev.build,
        'create_env_configs',
        'copy_to_dist',
        'inject_ng_templates',
        'optimize_build',
        'rename_rev_shell',
        'copy_webserver_configs_to_dist',
        done);
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
        config.folders.distBuild + 'css/',
        config.folders.distBuild,
        true).concat(configCopyTask));
});

gulp.task('optimize_build', () => {
    utils.log('Performing optimization for dist - bundling, minification and cache busting.');

    return utils.src(config.shell.file, 'optimize')
        .pipe($.useref({searchPath: './'}))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.csso()))
        .pipe($.rev())
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

function getStyleAssetsCopyTasks(cssFolder, cssParentFolder, optimizeImages) {
    let assets = config.getStyleAssets(cssFolder, cssParentFolder);
    let gulpTasks = assets.map(asset => {
        let gulpTask = utils.src([].concat(asset.src), 'style-assets');
        //TODO: Issue with image-min. Revisit.
        //if (asset.areImages && optimizeImages) {
        //    gulpTask = gulpTask.pipe($.imagemin({optimizationLevel: 4}));
        //}
        return gulpTask.pipe(gulp.dest(asset.dest));
    });
    return gulpTasks;
}
