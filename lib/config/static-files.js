'use strict';

let folders = require('./folders');

let images = {
    'default': (rootFolder, cssFolder) => ({
        src: [
            `${folders.assets}images/**/*.png`,
            `${folders.assets}images/**/*.jpg`,
            `${folders.assets}images/**/*.svg`,
            `${folders.assets}images/**/*.gif`
        ],
        dest: `${rootFolder}images/`
    })
};

let fonts = {
    'default': (rootFolder, cssFolder) => ({
        src: [
            `${folders.assets}fonts/**/*.eot`,
            `${folders.assets}fonts/**/*.svg`,
            `${folders.assets}fonts/**/*.ttf`,
            `${folders.assets}fonts/**/*.woff`,
            `${folders.assets}fonts/**/*.woff2`,
            `${folders.assets}fonts/**/*.otf`
        ],
        dest: `${rootFolder}fonts/`
    })
};

module.exports = {
    images: images,
    fonts: fonts,
    files: {},
    scripts: []
};
