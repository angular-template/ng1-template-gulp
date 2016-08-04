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
    let path = require('path');
    let fs = require('fs');
    let del = require('del');

    del.sync(symlinks.map(sl => sl.dest));
    try {
        symlinks.forEach(sl => {
            let src = path.resolve(sl.src);
            fs.symlinkSync(src, sl.dest);
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'EPERM' && err.errno === -4048) {
            console.error('***************************');
            console.error('*** PLEASE RUN AS ADMIN ***');
            console.error('***************************');
        }
    }
}
