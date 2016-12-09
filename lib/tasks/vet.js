'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let args = require('yargs').argv;
let $ = require('gulp-load-plugins')({lazy: true});

let utils = require('../utils');
let tsks = utils.taskNames;

let folders = require('../config/folders');
let modules = require('../config/modules').modules;
let options = require('../config/npm-options');
let styles = require('../config/styles');
let typings = require('../config/typings');
let tslint = require('../config/tslint');

let failOnVetError = args.failOnVetError;

gulp.task(tsks.vet.vet, done => {
    utils.log('Vetting application code');
    let tasks = [tsks.definitions.generate,
        'generate_modules',
        tsks.vet._compileTs, tsks.vet._lintTs];
    if (styles.usesLess) {
        tasks.push(tsks.vet._compileLess);
    }
    tasks.push(done);
    sequence.apply(this, tasks);
});

gulp.task('compile', done => {
    utils.log('Compiling Typescript code.');
    sequence(tsks.definitions.generate, 'generate_modules', tsks.vet._compileTs, done);
});

gulp.task('lint', done => {
    utils.log('Linting Typescript code.');
    sequence(tsks.definitions.generate, 'generate_modules', tsks.vet._lintTs, done);
});

gulp.task(tsks.vet._compileTs, () => {
    utils.log2('[Vet] Compiling Typescript files');
    let filesToCompile = [].concat(
        typings.all,
        `${folders.modules}**/*.ts`
    );
    let tsOptions = options.typescriptVet || options.typescriptBuild;
    tsOptions.noEmitOnError = !failOnVetError;
    utils.enforceTscOptions(tsOptions);
    return gulp.src(filesToCompile)
        .pipe($.typescript(tsOptions));
});

let tslintNames = [];
let tslintIndex = 0;
gulp.task(tsks.vet._lintTs, done => {
    tslintIndex = 0;
    for (let tslintName in tslint) {
        if (tslint.hasOwnProperty(tslintName)) {
            tslintNames.push(tslintName);
        }
    }
    let tasks = [];
    for (let i = 0; i < tslintNames.length; i++) {
        tasks.push(tsks.vet._lintTsCopyConfig);
        tasks.push(tsks.vet._lintTsRun);
        tasks.push(tsks.vet._lintTsIncrementCounter);
    }
    tasks.push(done);
    sequence.apply(this, tasks);
});

/* Copies the tslint file specified in config from the tools/tslint folder to the root and renames
   it to tslint.json. */
gulp.task(tsks.vet._lintTsCopyConfig, () => {
    let options = tslint[tslintNames[tslintIndex]];
    return gulp.src(options.config)
        .pipe($.rename('tslint.json'))
        .pipe(gulp.dest(folders.root))
});

gulp.task(tsks.vet._lintTsRun, () => {
    let options = tslint[tslintNames[tslintIndex]];
    utils.log(options.description || tslintNames[tslintIndex], $.util.colors.yellow.bgBlack);

    let filesToLint = [].concat(options.files)
        .concat(options.exclude.map(ex => `!${ex}`));
    return gulp.src(filesToLint)
        .pipe($.tslint({
            formatter: 'stylish'
        }))
        .pipe($.tslint.report({
            emitError: failOnVetError,
            sort: true
        }));
});

gulp.task(tsks.vet._lintTsIncrementCounter, done => {
    tslintIndex += 1;
    utils.clean(`${folders.root}tslint.json`, done);
});

gulp.task(tsks.vet._compileLess, () => {
    utils.log2('[Vet] Compiling LESS files');
    let lessFiles = modules.reduce(
        (files, mod) => files.concat(mod.styles.less || []),
        styles.less || []
    );
    return gulp.src(lessFiles)
        .pipe($.less());
});

gulp.task(tsks.vet._lintLess, () => {
    utils.log2('[Vet] Linting LESS files');
    let lessToLint = modules.reduce((files, mod) => files.concat(mod.lessToLint), []);
    return gulp.src(lessToLint)
        .pipe($.lesshint());
});
