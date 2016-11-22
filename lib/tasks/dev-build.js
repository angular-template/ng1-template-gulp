'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let merge = require('merge2');
let _ = require('lodash');
let $ = require('gulp-load-plugins')({lazy: true});

let config = require('../config');

let utils = require('../utils');
let tsks = utils.taskNames;

let args = require('yargs').argv;
let environment = args.env || config.config.defaultEnv;

gulp.task('code', done => {
    config.preferences.launchBrowserOnServe = false;
    sequence(tsks.dev.serve);
});

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
        tasks.unshift(tsks.vet._lintTs);
    }
    sequence.apply(this, tasks);
});

gulp.task(tsks.dev.clean, done => {
    utils.clean(config.folders.devBuild, done);
});

gulp.task('generate_modules', ['modules:check_non_module_folders'], done => {
    const fs = require('fs');
    const os = require('os');

    let configJson = fs.readFileSync(`${config.folders.client}config.json`, 'utf8');
    let envConfig = JSON.parse(configJson);
    let appModuleCode = buildAppModuleCode(config.modules, envConfig)
        .concat('')
        .join(os.EOL);
    fs.writeFileSync(`${config.folders.modules}app.ts`, appModuleCode);

    for (let i = 0; i < config.modules.length; i++) {
        let moduleCode = buildModuleCode(config.modules, i)
            .concat('')
            .join(os.EOL);
        let name = config.modules[i].name;
        fs.writeFileSync(`${config.folders.modules}${name}/${name}.module.ts`, moduleCode);
    }

    done();
});

function buildAppModuleCode(modules, envConfig) {
    let moduleNames = modules.map(m => `'${m.name}'`).reverse().join(', ');
    let code = [
        `namespace app {`,
        `    export const appModule: ng.IModule = angular.module('app', [${moduleNames}]);`,
        ``,
        `    appModule.component('app', {`,
        `        template: '<div ui-view></div>'`,
        `    });`,
        ``,
        `    export interface IConfig {`
    ];

    iterateProperties(envConfig[config.config.defaultEnv].config, code, 8);

    code.push(`    }`);
    code.push(`}`);

    return code;
}

function iterateProperties(envConfig, code, indent) {
    for (let prop in envConfig) {
        if (envConfig.hasOwnProperty(prop)) {
            let type = typeof envConfig[prop];
            if (type === 'object') {
                code.push(`${indentStr(indent)}${prop}: {`);
                iterateProperties(envConfig[prop], code, indent+ 4);
                code.push(`${indentStr(indent)}};`);
            } else {
                code.push(`${indentStr(indent)}${prop}: ${typeof envConfig[prop]};`);
            }
        }
    }
}

function indentStr(length) {
    return Array(length + 1).join(' ');
}

function buildModuleCode(modules, index) {
    let module = modules[index];
    let code = [
        `namespace ${module.ns || module.name} {`,
        `    import core = ng1Template.core;`,
        ``,
        `    export const ${module.name}Module: ng.IModule = angular.module('${module.name}', [`
    ];
    for (let i = index - 1; i >= 0; i--) {
        code.push(`        '${modules[i].name}',`);
    }
    // for (let i = 0; i < (module.peerDependencies.length || []); i++) {
    //     code.push(`        '${module.peerDependencies[i]}',`);
    // }
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
        `        details: core.IComponentDetails`,
        `    ): core.ClassDecorator => {`,
        `        return (target: Function): void => {`,
        `            core.registerComponent({`,
        `                name: details.selector,`,
        `                controller: target,`,
        `                templateUrl: details.templateUrl,`,
        `                templateUrlRoot: details.templateUrlRoot,`,
        `            }, ${module.name}Module);`,
        `        };`,
        `    };`,
        ``,
        `    export let Page: core.PageDecoratorFactory = (`,
        `        details: core.IComponentDetails, route: core.IComponentRoute`,
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
        ``,
        `    export let InjectableState: core.ServiceDecoratorFactory = (name: string): core.ClassDecorator => {`,
        `        return (target: Function): void => {`,
        `            core.registerState({`,
        `                name: name,`,
        `                state: target,`,
        `                module: ${module.name}Module`,
        `            });`,
        `        };`,
        `    };`,
        `}`
    ]);
    return code;
}

gulp.task('modules:check_non_module_folders', done => {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    const _ = require('lodash');

    let foldersUnderModules = fs.readdirSync(config.folders.modules)
        .filter(file => {
            let stat = fs.statSync(`${config.folders.modules}${file}`);
            return stat && stat.isDirectory();
        });

    let moduleNames = config.modules.map(mod =>
        path.basename(mod.folder)
    );

    let extraFolders = _.difference(foldersUnderModules, moduleNames);
    if (extraFolders && extraFolders.length > 0) {
        let message = [
            `Non-module folders found under the ${config.folders.modules} folder.`,
            `Extra folder(s) found: ${extraFolders}`,
            `If these are meant to be modules, specify them as such in the gulp.config.ts file using the config.modules collection.`,
            `If not, then please move them under an existing module folder or create a new module to contain them.`
        ];
        let error = new Error(message.join(os.EOL));
        error.folders = extraFolders;
        throw error;
    }

    done();
});

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

    let compileTask = utils.src(filesToCompile, 'script-compile');
    if (config.scripts.sourceMaps) {
        compileTask = compileTask.pipe($.sourcemaps.init());
    }

    let compileOptions = config.options.typescriptBuild;
    compileOptions.noImplicitAny = true;
    compileTask = compileTask.pipe($.typescript(compileOptions));

    let task = compileTask.js
        .pipe($.ngAnnotate());
    if (config.scripts.sourceMaps) {
        task = task.pipe($.sourcemaps.write());
    }
    return task.pipe($.stripLine(`/// <reference path="`))
        .pipe(gulp.dest(config.folders.devBuildScripts));
});

gulp.task('handle_styles', done => {
    utils.log('Handling styles for the application.');

    // if (!config.styles.usesLess && !config.styles.usesSass) {
    //     done();
    //     return;
    // }

    let tasks = ['styles:copy_css'];
    if (config.styles.usesLess) {
        tasks.push('styles:compile_less');
    }
    if (config.styles.usesSass) {
        tasks.push('styles:compile_sass');
    }
    tasks.push(done);
    sequence.apply(this, tasks);
});

gulp.task('styles:copy_css', () => {
    return gulp.src([
        `${config.folders.assets}css/**/*.css`,
        `${config.folders.modules}**/*.css`
    ])
    .pipe($.flatten())
    .pipe(gulp.dest(config.folders.devBuildStyles));
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
    let lessTask = utils.src(lessFiles, 'compile-less')
        .pipe($.less());
    if (config.styles.autoPrefix) {
        lessTask = lessTask.pipe($.autoprefixer(config.options.autoPrefixer));
    }
    return lessTask.pipe(gulp.dest(config.folders.devBuildStyles));
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

    let customSrc = gulp.src(config.staticFiles.scripts || []);
    let customOptions = {
        starttag: '<!-- inject:custom:js -->'
    };

    let cssFiles = config.styles.injections || [];
    let cssSrc = gulp.src(cssFiles, {read: false});

    let firstJsSrc = gulp.src(config.injections.firstJs(config.modules));

    let injectTask = utils.src(config.shell.file, 'local-inject')
        .pipe($.inject(configSrc, configOptions))
        .pipe($.inject(customSrc, customOptions))
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
        config.folders.devBuild,
        config.folders.devBuildStyles,
        false
    );
    return merge(assetTasks);
});

function getStyleAssetsCopyTasks(rootFolder, cssFolder, optimizeImages) {
    if (config.preferences.addModuleImagesToStaticFiles) {
        for (let m = 0; m < config.modules.length; m++) {
            config.staticFiles.images[`module-${config.modules[m].name}`] = (rootFolder, cssFolder) => ({
                src: [
                    `${config.modules[m].folder}**/*.png`,
                    `${config.modules[m].folder}**/*.jpg`,
                    `${config.modules[m].folder}**/*.svg`,
                    `${config.modules[m].folder}**/*.gif`
                ],
                dest: `${rootFolder}images/${config.modules[m].name}/`
            })
        };
    }

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
