'use strict';

let gulp = require('gulp');
let sequence = require('run-sequence');
let $ = require('gulp-load-plugins')({lazy: true});

let utils = require('../utils');
let tsks = utils.taskNames;

let folders = require('../config/folders');
let modules = require('../config/modules').modules;
let shell = require('../config/shell');

/* Creates a fresh index.html file from the index.html.template.
   By doing this, we do not have to have index.html in version control, so the constant changes to
   it due to the inject tasks can be ignored. */
gulp.task(tsks.shell.generate, done => {
    utils.log(`Generating the ${shell.fileName} shell file.`);
    sequence(tsks.shell.deleteFile, tsks.shell.copyTemplate, done);
});

gulp.task(tsks.shell.deleteFile, done => {
    utils.clean(shell.file, done);
});

gulp.task(tsks.shell.copyTemplate, () => {
    let modulePlaceholders = getModulePlaceholders();
    return gulp.src(shell.template)
        .pipe($.injectString.replace('<!-- custom-modules -->', modulePlaceholders))
        .pipe($.rename(shell.fileName))
        .pipe(gulp.dest(shell.folder))
});

function getModulePlaceholders() {
    let eol = require('os').EOL;
    return modules.reduce((ph, mod) =>
        ph + `    <!-- build:js js/${mod.name}.js -->${eol}` +
            `    <!-- inject:${mod.name}:js -->${eol}` +
            `    <!-- endinject -->${eol}` +
            `    <!-- inject:${mod.name}-templates:js -->${eol}` +
            `    <!-- endinject -->${eol}` +
            `    <!-- endbuild -->${eol}${eol}`, '');
}
