'use strict';

let gulp = require('gulp');
let $ = require('gulp-load-plugins')({lazy: true});

let utils = require('../utils');
let tsks = utils.taskNames;

let config = require('../config');
let folders = require('../config/folders');

gulp.task(tsks.help, $.taskListing.withFilters(/(_|:)/,
    task => task === tsks.default || task === tsks.help));

gulp.task(tsks.default, [tsks.dev.serve]);

gulp.task('clean', [tsks.dist.clean, tsks.dev.clean], done => {
    utils.clean(config.shell.file);
    utils.clean(config.definitions.appFile);
    utils.clean(folders.build, done);
});

gulp.task('config', done => {
    utils.log('Listing the Gulp configuration below:');
    console.info(JSON.stringify(config, (key, value) => typeof value === 'function' ? value.toString() : value, 4));
    done();
});

gulp.task('clean-tslint-disables', () =>
    gulp.src(`${config.folders.modules}**/*.ts`)
        .pipe($.stripLine([
            /\/\/\s*tslint\s*:\s*(disable|enable)/,
            /\/\*\s*tslint\s*:\s*(disable|enable)/
        ]))
        .pipe(gulp.dest(config.folders.modules))
);
