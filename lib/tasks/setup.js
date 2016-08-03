'use strict';

let gulp = require('gulp');
let $ = require('gulp-load-plugins')({lazy: true});

let utils = require('../utils');

gulp.task('setup', done => {
    utils.log('Creating GIT hooks.');
    createSymlinks([
        { src: './.pre-commit', dest: './.git/hooks/pre-commit'}
    ]);
    done();
});

/**
 * Creates one or more symbolic links.
 * @param {Object[]} symlinks - Symlink details
 * @param {string} symlinks[].src - Source file path
 * @param {string} symlinks[].dest - Symbolic link file path
 */
function createSymlinks(symlinks) {
    let fs = require('fs');
    let del = require('del');

    del(symlinks.map(sl => sl.dest)).then(paths => {
        try {
            symlinks.forEach(sl => fs.symlinkSync(sl.src, sl.dest));
        } catch (err) {
            if (err.errno === -4048) {
                console.error(err);
                console.error('***************************');
                console.error('*** PLEASE RUN AS ADMIN ***');
                console.error('***************************');
            }
        }
    });
}
