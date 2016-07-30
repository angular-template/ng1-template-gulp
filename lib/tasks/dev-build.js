'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let merge = require('merge2');
let $ = require('gulp-load-plugins')({lazy: true});

let config = require('../config');

let utils = require('../utils');
let tsks = utils.taskNames;

let args = require('yargs').argv;
let environment = args.env || config.config.defaultEnv;

gulp.task(tsks.dev.serve, [tsks.dev.build], () => {
    utils.serve(true);
});

gulp.task(tsks.dev.build, done => {
    let tasks = [
        tsks.dev.clean,
        tsks.shell.generate,
        [tsks.inject.vendor, 'compile_scripts'],
        'handle_styles',
        'create_config',
        [tsks.inject.local, 'copy_static_to_dev'],
        done
    ];
    if (config.preferences.vetBeforeDevBuild) {
        tasks.unshift(tsks.vet.vet);
    }
    sequence.apply(this, tasks);
});

gulp.task(tsks.dev.clean, done => {
    utils.clean(config.folders.devBuild, done);
});

gulp.task('generate_modules', done => {
    const fs = require('fs');
    const os = require('os');

    for (let i = 0; i < config.modules.length; i++) {
        let moduleCode = buildModuleCode(config.modules, i)
            .concat('')
            .join(os.EOL);
        let name = config.modules[i].name;
        fs.writeFileSync(`${config.folders.modules}${name}/${name}.module.ts`, moduleCode);
    }

    done();
});

function buildModuleCode(modules, index) {
    let module = modules[index];
    let code = [
        `// tslint:disable`,
        `namespace ${module.ns || module.name} {`,
        `    import core = ng1Template.core;`,
        ``,
        `    export const ${module.name}Module: ng.IModule = angular.module('${module.name}', [`
    ];
    for (let i = index - 1; i >= 0; i--) {
        code.push(`        '${modules[i].name}',`);
    }
    for (let i = 0; i < (config.coreDependencies.length || []); i++) {
        code.push(`        '${config.coreDependencies[i]}',`);
    }
    if (module.dependencies && module.dependencies.length) {
        for (let i = 0; i < module.dependencies.length; i++) {
            code.push(`        '${module.dependencies[i]}',`);
        }
    }
    code = code.concat([
        `    ]);`,
        ``,
        `    export let Component: core.ComponentDecoratorFactory = (`,
        `        details: core.IComponentDetails, route?: core.IComponentRoute`,
        `    ): core.ClassDecorator => {`,
        `        return (target: Function): void => {`,
        `            core.registerComponent({`,
        `                name: details.selector,`,
        `                controller: target,`,
        `                templateUrl: details.templateUrl,`,
        `                templateUrlRoot: details.templateUrlRoot,`,
        `                route: route`,
        `            }, ${module.name}Module);`,
        `        };`,
        `    };`,
        ``,
        `    export let Layout: core.LayoutDecoratorFactory = (details: core.ILayoutDetails): core.ClassDecorator => {`,
        `        return (target: Function): void => {`,
        `            core.registerLayout({`,
        `                name: details.name,`,
        `                controller: target,`,
        `                templateUrl: details.templateUrl,`,
        `                templateUrlRoot: details.templateUrlRoot`,
        `            }, ${module.name}Module);`,
        `        };`,
        `    };`,
        ``,
        `    export let Injectable: core.ServiceDecoratorFactory = (name: string): core.ClassDecorator => {`,
        `        return (target: Function): void => {`,
        `            core.registerService({`,
        `                name: name,`,
        `                service: target,`,
        `                module: ${module.name}Module`,
        `            });`,
        `        };`,
        `    };`,
        `}`
    ]);
    return code;
}

gulp.task(tsks.inject.vendor, () => {
    utils.log('Wiring up Bower script dependencies.');

    let wiredep = require('wiredep').stream;
    // let options = config.options.wiredep;
    // options.bowerJson = require(`${config.folders.root}bower.json`);
    return gulp.src(config.shell.file)
        .pipe(wiredep(config.options.wiredep))
        .pipe(gulp.dest(config.folders.client))
});

gulp.task('compile_scripts', ['generate_modules', tsks.definitions.generate], () => {
    utils.log('Transpiling Typescript code to JavaScript');

    let filesToCompile = [].concat(
        config.definitions.all,
        `${config.folders.modules}**/*.ts`
    );
    let compileTask = utils.src(filesToCompile, 'script-compile')
        .pipe($.typescript(config.options.typescriptBuild));
    return compileTask.js
        .pipe($.ngAnnotate())
        .pipe($.stripLine(`/// <reference path="`))
        .pipe(gulp.dest(config.folders.devBuildScripts));
});

gulp.task('handle_styles', done => {
    utils.log('Handling styles for the application.');

    if (!config.styles.usesLess && !config.styles.usesSass) {
        done();
        return;
    }

    let tasks = [];
    if (config.styles.usesLess) {
        tasks.push('styles:compile_less');
    }
    if (config.styles.usesSass) {
        tasks.push('styles:compile_sass');
    }
    tasks.push(done);
    sequence.apply(this, tasks);
});

gulp.task('styles:compile_less', done => {
    utils.log2('Compiling LESS files to CSS stylesheets');

    let lessFiles = config.modules.reduce(
        (files, mod) => files.concat(mod.styles.less || []),
        config.styles.less || []
    );
    if (lessFiles.length === 0) {
        done();
    }
    return utils.src(lessFiles, 'compile-less')
        .pipe($.less())
        .pipe(gulp.dest(config.folders.devBuildStyles));
});

gulp.task('styles:compile_sass', done => {
    utils.log2('Compiling SASS files to CSS stylesheets');
    throw new Error('SASS support not yet available.');
});

gulp.task('create_config', () => {
    utils.log('Generating AngularJS constants file to store environment-specific configuration.');

    return utils.src(config.config.src)
        .pipe($.ngConfig(config.config.moduleName, {
            environment: environment,
            createModule: false
        }))
        .pipe(gulp.dest(config.folders.devBuildScripts));
});

gulp.task(tsks.inject.local, () => {
    utils.log('Injecting local script and CSS references.');

    let configSrc = gulp.src(config.config.defaultOutput);
    let configOptions = {
        starttag: '<!-- inject:config:js -->'
    };

    let cssFiles = config.styles.injections || [];
    let cssSrc = gulp.src(cssFiles, {read: false});

    let firstJsSrc = gulp.src(config.injections.firstJs(config.modules));

    let injectTask = utils.src(config.shell.file, 'local-inject')
        .pipe($.inject(configSrc, configOptions))
        .pipe($.inject(cssSrc))
        .pipe($.inject(firstJsSrc));

    let jsSrc, jsOptions;
    config.modules.forEach(mod => {
        jsSrc = gulp.src([].concat(
            mod.jsToInject,
            utils.exclude(config.injections.firstJs(config.modules))
        ));
        jsOptions = {
            starttag: `<!-- inject:${mod.name}:js -->`
        };
        injectTask = injectTask
            .pipe($.inject(jsSrc, jsOptions));
    });
    injectTask = injectTask.pipe(gulp.dest(config.folders.client));
    return injectTask;
});

gulp.task('copy_static_to_dev', () => {
    utils.log('Copying static JavaScript, CSS and style asset files to dev build folder.');

    let assetTasks = getStyleAssetsCopyTasks(
        config.folders.devBuildStyles,
        config.folders.devBuild,
        false
    );
    return merge(assetTasks);
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
