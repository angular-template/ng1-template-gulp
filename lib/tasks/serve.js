'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let $ = require('gulp-load-plugins')({lazy: true});

let config = require('../config');
let utils = require('../utils');

gulp.task('watch:ts_handler', done => {
    sequence('compile_scripts', 'inject_custom_scripts', 'watch:handler_done', done);
});

gulp.task('watch:css_handler', done => {
    sequence('styles:copy_css', 'inject_custom_scripts', 'watch:handler_done', done);
});

gulp.task('watch:less_handler', done => {
    sequence('styles:compile_less', 'inject_custom_scripts', 'watch:handler_done', done);
});

gulp.task('watch:statics_handler', done => {
    sequence('copy_static_to_dev', 'watch:handler_done', done);
});

gulp.task('watch:config_handler', done => {
    sequence('create_config', 'watch:handler_done', done);
});

gulp.task('watch:handler_done', done => {
    utils.log('Changes handled! Please reload browser.', $.util.colors.white.bgGreen);
    done();
});
