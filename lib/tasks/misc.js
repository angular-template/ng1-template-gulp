'use strict';

let gulp = require('gulp');
let $ = require('gulp-load-plugins')({lazy: true});

let utils = require('../utils');
let tsks = utils.taskNames;

let config = require('../config');
let folders = require('../config/folders');
let shell = require('../config/shell');

gulp.task(tsks.help, $.taskListing.withFilters(/(_|:)/,
    task => task === tsks.default || task === tsks.help));

gulp.task(tsks.default, [tsks.dev.serve]);

gulp.task('clean_shell', done => {
    utils.clean(shell.file, done);
});

gulp.task('clean', [tsks.dist.clean, tsks.dev.clean, 'clean_shell'], done => {
    utils.clean(folders.build, done);
});

gulp.task('config', done => {
    utils.log('Listing the Gulp configuration below:');
    console.info(JSON.stringify(config, (key, value) => typeof value === 'function' ? value.toString() : value, 4));
    done();
});
