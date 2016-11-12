'use strict';

let folders = require('./folders');

let images = {
    'default': (rootFolder, cssFolder) => ({
        src: [`${folders.assets}images/**/*.+(png|jpg|jpeg|svg|gif|ico)`],
        dest: `${rootFolder}images/`
    })
};

let fonts = {
    'default': (rootFolder, cssFolder) => ({
        src: [`${folders.assets}fonts/**/*.+(eot|svg|ttf|woff|woff2|otf)`],
        dest: `${rootFolder}fonts/`
    })
};

module.exports = {
    images: images,
    fonts: fonts,
    files: {},
    scripts: []
};
